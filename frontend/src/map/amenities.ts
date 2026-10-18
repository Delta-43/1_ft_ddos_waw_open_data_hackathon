import { Marker, Popup, type Map } from 'maplibre-gl';
import type { Route } from '../api/contract';
import { getLang } from '../i18n/language';
import { translate, type Key } from '../i18n/translations';
import { loadCache, near, segmentsOf, toMetres, type CacheFeature, type Point } from './corridor';

/**
 * Public toilets and defibrillators (AEDs) near the selected route, from the cached
 * OpenStreetMap extract (corridor-cache.json). The visitor switches each kind on or off.
 */
export type AmenityKind = 'toilets' | 'aed';
const NEAR_M = 300;
/** On the map, one icon of a kind per this many metres: Centrum alone has dozens of AEDs. */
const SPACING_M = 200;
const t = (key: Key) => translate(getLang(), key);

const ICON: Record<AmenityKind, string> = {
  // Drawn glyphs: a figure pair for toilets, a heart with a bolt for an AED.
  toilets: '<svg viewBox="0 0 20 20" aria-hidden="true"><circle cx="6.5" cy="4.5" r="1.6" fill="currentColor"/><circle cx="13.5" cy="4.5" r="1.6" fill="currentColor"/><path d="M5 7.5h3v4.5H7v4.5H6v-4.5H5zM12 7.5h3l1 5h-1.3v4H12.3v-4H11z" fill="currentColor"/></svg>',
  aed: '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M10 17s-6.5-3.9-6.5-8.6A3.5 3.5 0 0 1 10 6.2a3.5 3.5 0 0 1 6.5 2.2C16.5 13.1 10 17 10 17z" fill="currentColor"/><path d="M10.6 7.8 8.4 11h2.2l-1 3 2.6-3.6H10z" fill="#0b2a19"/></svg>',
};

/** Near-route amenities of each kind, for the toggle counts and the markers. */
export async function amenitiesNear(route: Route | undefined): Promise<Record<AmenityKind, CacheFeature[]>> {
  const empty = { toilets: [], aed: [] } as Record<AmenityKind, CacheFeature[]>;
  const data = await loadCache();
  if (!route || !data) return empty;
  const segments = segmentsOf(route);
  for (const feature of data.features) {
    const kind = feature.properties.kind as AmenityKind;
    if (feature.properties.k !== 'a' || !(kind in empty) || feature.geometry.type !== 'Point') continue;
    if (near(toMetres(feature.geometry.coordinates as Point), segments, NEAR_M)) empty[kind].push(feature);
  }
  return empty;
}

function details(feature: CacheFeature): HTMLElement {
  const p = feature.properties as Record<string, string | undefined>;
  const kind = p.kind as AmenityKind;
  const root = document.createElement('div');
  root.className = 'amenity-popup__body';
  const title = document.createElement('p');
  title.className = 'amenity-popup__title';
  title.textContent = p.name ?? t(kind === 'aed' ? 'amenityAed' : 'amenityToilets');
  root.append(title);
  const rows: [Key, string | undefined][] = [
    ['amenityHours', p.opening_hours],
    ['amenityAccess', p.access],
    ['amenityFee', p.fee],
    ['amenityWheelchair', p.wheelchair],
    ['amenityWhere', [p.indoor === 'yes' ? t('amenityIndoors') : undefined, p.level ? `${t('amenityLevel')} ${p.level}` : undefined].filter(Boolean).join(' · ') || undefined],
    ['amenityOperator', p.operator],
  ];
  const list = document.createElement('dl');
  for (const [label, value] of rows) {
    if (!value) continue;
    const dt = document.createElement('dt');
    dt.textContent = t(label);
    const dd = document.createElement('dd');
    dd.textContent = value;
    list.append(dt, dd);
  }
  if (list.childElementCount) root.append(list);
  const source = document.createElement('p');
  source.className = 'amenity-popup__source';
  source.textContent = t('amenitySource');
  root.append(source);
  return root;
}

const markers = new WeakMap<Map, Marker[]>();
let request = 0;

/** Shows the chosen kinds near `route`; an empty set or no route clears them. */
export function showAmenities(map: Map, route: Route | undefined, kinds: Set<AmenityKind>): void {
  const ticket = ++request;
  for (const marker of markers.get(map) ?? []) marker.remove();
  markers.delete(map);
  if (!route || kinds.size === 0) return;
  void amenitiesNear(route).then(found => {
    if (ticket !== request) return;
    const list: Marker[] = [];
    for (const kind of kinds) {
      const placed: Point[] = [];
      for (const feature of found[kind]) {
        const [x, y] = toMetres(feature.geometry.coordinates as Point);
        if (placed.some(([px, py]) => Math.hypot(px - x, py - y) < SPACING_M)) continue;
        placed.push([x, y]);
        const el = document.createElement('button');
        el.type = 'button';
        el.className = `amenity-marker amenity-marker--${kind}`;
        el.setAttribute('aria-label', (feature.properties.name as string | undefined) ?? t(kind === 'aed' ? 'amenityAed' : 'amenityToilets'));
        el.innerHTML = ICON[kind];
        const point = feature.geometry.coordinates as Point;
        el.addEventListener('click', event => {
          event.stopPropagation();
          new Popup({ offset: 14, className: 'amenity-popup', maxWidth: '16rem' }).setLngLat(point).setDOMContent(details(feature)).addTo(map);
        });
        list.push(new Marker({ element: el }).setLngLat(point).addTo(map));
      }
    }
    markers.set(map, list);
  });
}
