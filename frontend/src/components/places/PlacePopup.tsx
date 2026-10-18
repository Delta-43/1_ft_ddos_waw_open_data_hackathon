import { Popup, type Map } from 'maplibre-gl';
import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { sourceFor, type Route, type Source } from '../../api/contract';
import { PlaceCard } from './PlaceCard';
import './places.css';

/** Everything floating over the map that a card must not cover. */
const OVERLAYS = '.corner, .site-title, .assistant__panel:not([hidden]), .assistant__row, .maplibregl-ctrl-top-right';
const GAP = 12;

/**
 * How far to pan the map (in pixels) so `card` clears the overlays it overlaps and stays on screen.
 * Panning by +x moves the map content, and the card with it, to the left.
 */
function clearOfPanels(card: DOMRect): [number, number] {
  let dx = 0;
  let dy = 0;
  for (const element of Array.from(document.querySelectorAll(OVERLAYS))) {
    for (const box of Array.from(element.getClientRects())) {
      const moved = new DOMRect(card.x - dx, card.y - dy, card.width, card.height);
      const overlapX = Math.min(moved.right, box.right) - Math.max(moved.left, box.left);
      const overlapY = Math.min(moved.bottom, box.bottom) - Math.max(moved.top, box.top);
      if (overlapX <= 0 || overlapY <= 0) continue;
      // Leave sideways, away from the overlay's side of the screen: the cheaper of the two moves.
      const sideways = box.left + box.width / 2 > window.innerWidth / 2 ? overlapX + GAP : -(overlapX + GAP);
      const vertical = box.top + box.height / 2 > window.innerHeight / 2 ? overlapY + GAP : -(overlapY + GAP);
      if (Math.abs(sideways) <= Math.abs(vertical)) dx += sideways;
      else dy += vertical;
    }
  }
  // Keep the card itself on screen.
  const final = new DOMRect(card.x - dx, card.y - dy, card.width, card.height);
  if (final.top < GAP) dy += final.top - GAP;
  if (final.bottom > window.innerHeight - GAP) dy += final.bottom - window.innerHeight + GAP;
  return [dx, dy];
}

interface PlacePopupProps {
  map: Map;
  route: Route;
  placeId: string;
  sources: Source[];
  onClose: () => void;
}

/**
 * The place card as a pop-up next to its stop (IDEA.md: "pop-up cards above locations"), moved clear
 * of every panel and button on screen (#114).
 * MapLibre owns the pop-up's position; React renders the card into it through a portal.
 */
export function PlacePopup({ map, route, placeId, sources, onClose }: PlacePopupProps) {
  const place = route.places.find(candidate => candidate.id === placeId);
  const stop = route.stops.find(candidate => candidate.place_id === placeId);
  const container = useMemo(() => document.createElement('div'), []);
  const [, setMounted] = useState(false);

  useEffect(() => {
    if (!place) return;
    const popup = new Popup({ offset: 18, maxWidth: 'min(22rem, calc(100vw - 6rem))', className: 'place-popup', focusAfterOpen: false })
      .setLngLat([place.longitude, place.latitude])
      .setDOMContent(container)
      .addTo(map);
    popup.on('close', onClose);
    setMounted(true);
    // Once React has rendered the card into it, nudge the map so it doesn't sit under a panel or button.
    const timer = window.setTimeout(() => {
      const element = popup.getElement();
      const [dx, dy] = element ? clearOfPanels(element.getBoundingClientRect()) : [0, 0];
      if (dx || dy) map.panBy([dx, dy], { duration: 300 });
    }, 60);
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') popup.remove(); };
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.clearTimeout(timer);
      popup.off('close', onClose);
      popup.remove();
    };
    // Re-open only when the place changes, not when the parent re-renders a new onClose.
  }, [map, place, container]);

  if (!place) return null;
  return createPortal(<PlaceCard place={place} stop={stop} source={sourceFor(sources, place.source_id)} selected />, container);
}
