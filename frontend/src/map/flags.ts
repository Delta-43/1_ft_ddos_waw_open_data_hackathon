import { Marker, type Map } from 'maplibre-gl';
import type { Route } from '../api/contract';
import { CITY_FLAGS, type CityFlag, type FlagKind } from '../data/cityNotes';

/**
 * Blue message flags near the selected route: events, shop offers and tickets
 * (data/cityNotes.ts). A flag shows a few words; clicking opens its card, which always says
 * whether the listing is real or invented for the demo.
 */
const NEAR_M = 300;
/** Fewer on a phone, where the open map is small. */
const maxFlags = () => (window.matchMedia('(max-width: 700px)').matches ? 4 : 6);
const M_PER_DEG_LAT = 110_540;
const M_PER_DEG_LNG = 111_320 * Math.cos((52.22 * Math.PI) / 180);

const ICONS: Record<FlagKind, string> = {
  // Small inline glyphs: a calendar star, a tag, a ticket.
  event: '<path d="M4 6.5h12v9a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1zM4 6.5V5a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1.5M7 2.5v3M13 2.5v3M10 9.2l.9 1.8 2 .3-1.45 1.4.35 2-1.8-.95-1.8.95.35-2L7.1 11.3l2-.3z"/>',
  offer: '<path d="M10.5 3H16a1 1 0 0 1 1 1v5.5L9.5 17 3 10.5zM13.5 6.5h.01"/>',
  tickets: '<path d="M3 7a2 2 0 0 0 0 4v3a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-3a2 2 0 0 1 0-4V4a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1zM12 3.5v11"/>',
};
const KIND_TEXT: Record<FlagKind, string> = { event: 'Event', offer: 'Offer', tickets: 'Tickets' };

function distanceToRoute(flag: CityFlag, route: Route): number {
  const x = flag.longitude * M_PER_DEG_LNG;
  const y = flag.latitude * M_PER_DEG_LAT;
  const points = route.geometry.coordinates.map(([lng, lat]) => [lng * M_PER_DEG_LNG, lat * M_PER_DEG_LAT]);
  let best = Infinity;
  for (let i = 1; i < points.length; i++) {
    const [[ax, ay], [bx, by]] = [points[i - 1], points[i]];
    const dx = bx - ax;
    const dy = by - ay;
    const length = dx * dx + dy * dy;
    const t = length === 0 ? 0 : Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / length));
    best = Math.min(best, Math.hypot(x - (ax + t * dx), y - (ay + t * dy)));
  }
  return best;
}

function element(flag: CityFlag, onOpen: (el: HTMLElement) => void): HTMLElement {
  const root = document.createElement('div');
  root.className = `city-flag city-flag--${flag.kind}${flag.mode === 'real' ? ' city-flag--real' : ''}`;
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'city-flag__pill';
  button.setAttribute('aria-expanded', 'false');
  button.setAttribute('aria-label', `${KIND_TEXT[flag.kind]}: ${flag.title}${flag.mode === 'mock' ? ' (demo, fictional)' : ''}`);
  button.innerHTML = `<svg viewBox="0 0 20 20" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${ICONS[flag.kind]}</svg><span></span>`;
  button.querySelector('span')!.textContent = flag.short;

  const card = document.createElement('div');
  card.className = 'city-flag__card';
  card.hidden = true;
  const rows: [string, string][] = [['city-flag__kind', `${KIND_TEXT[flag.kind]} · ${flag.mode === 'real' ? 'Real' : 'Demo'}`], ['city-flag__title', flag.title], ['city-flag__place', flag.place], ['city-flag__when', flag.when], ['city-flag__detail', flag.detail], ['city-flag__source', flag.source]];
  for (const [className, text] of rows) {
    const p = document.createElement('p');
    p.className = className;
    p.textContent = text;
    card.append(p);
  }
  button.addEventListener('click', event => {
    event.stopPropagation();
    const open = card.hidden;
    card.hidden = !open;
    button.setAttribute('aria-expanded', String(open));
    root.classList.toggle('city-flag--open', open);
    // Near the top of the screen the card opens downwards, clear of the title and credits.
    root.classList.toggle('city-flag--below', open && root.getBoundingClientRect().top < 260);
    if (open) onOpen(root);
  });
  const stem = document.createElement('span');
  stem.className = 'city-flag__stem';
  root.append(card, button, stem);
  return root;
}

const markers = new WeakMap<Map, Marker[]>();
const tidiers = new WeakMap<Map, () => void>();

/**
 * Keeps flags from covering each other: in order of closeness to the route, a flag whose pill
 * would overlap one already placed is tucked down to its icon (a click opens its card).
 */
function tidy(map: Map, list: Marker[]): void {
  const placed: DOMRect[] = [];
  for (const marker of list) {
    const el = marker.getElement();
    if (el.classList.contains('city-flag--open')) continue;
    el.classList.remove('city-flag--tucked');
    const pill = el.querySelector('.city-flag__pill')!.getBoundingClientRect();
    const overlaps = placed.some(r => pill.left < r.right + 4 && pill.right > r.left - 4 && pill.top < r.bottom + 3 && pill.bottom > r.top - 3);
    if (overlaps) el.classList.add('city-flag--tucked');
    else placed.push(pill);
  }
}

/** Shows the flags near `route` (none when undefined). */
export function showFlags(map: Map, route: Route | undefined): void {
  for (const marker of markers.get(map) ?? []) marker.remove();
  markers.delete(map);
  const previous = tidiers.get(map);
  if (previous) map.off('moveend', previous);
  tidiers.delete(map);
  if (!route) return;
  // Only one card open at a time.
  const closeOthers = (open: HTMLElement) => {
    for (const marker of markers.get(map) ?? []) {
      const el = marker.getElement();
      if (el === open || !el.classList.contains('city-flag--open')) continue;
      el.classList.remove('city-flag--open');
      el.querySelector<HTMLElement>('.city-flag__card')!.hidden = true;
      el.querySelector('button')!.setAttribute('aria-expanded', 'false');
    }
  };
  const near = CITY_FLAGS
    .map(flag => ({ flag, distance: distanceToRoute(flag, route) }))
    .filter(({ distance }) => distance <= NEAR_M)
    .sort((a, b) => a.distance - b.distance)
    .slice(0, maxFlags());
  const list = near.map(({ flag }) =>
    new Marker({ element: element(flag, closeOthers), anchor: 'bottom' }).setLngLat([flag.longitude, flag.latitude]).addTo(map));
  markers.set(map, list);
  const onSettle = () => tidy(map, list);
  tidiers.set(map, onSettle);
  map.on('moveend', onSettle);
  requestAnimationFrame(onSettle);
}
