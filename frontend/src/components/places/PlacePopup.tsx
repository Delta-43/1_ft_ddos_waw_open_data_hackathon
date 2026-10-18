import { Popup, type Map } from 'maplibre-gl';
import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { sourceFor, type Route, type Source } from '../../api/contract';
import { PlaceCard } from './PlaceCard';
import './places.css';

interface PlacePopupProps {
  map: Map;
  route: Route;
  placeId: string;
  sources: Source[];
  onClose: () => void;
}

/**
 * The place card as a pop-up above its marker.
 * MapLibre owns the pop-up's position; React renders the card into it through a portal.
 */
export function PlacePopup({ map, route, placeId, sources, onClose }: PlacePopupProps) {
  const place = route.places.find(candidate => candidate.id === placeId);
  const stop = route.stops.find(candidate => candidate.place_id === placeId);
  const container = useMemo(() => document.createElement('div'), []);
  const [, setMounted] = useState(false);

  useEffect(() => {
    if (!place) return;
    const popup = new Popup({ offset: 18, maxWidth: '22rem', className: 'place-popup', focusAfterOpen: false })
      .setLngLat([place.longitude, place.latitude])
      .setDOMContent(container)
      .addTo(map);
    popup.on('close', onClose);
    setMounted(true);
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') popup.remove(); };
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      popup.off('close', onClose);
      popup.remove();
    };
    // Re-open only when the place changes, not when the parent re-renders a new onClose.
  }, [map, place, container]);

  if (!place) return null;
  return createPortal(<PlaceCard place={place} stop={stop} source={sourceFor(sources, place.source_id)} selected />, container);
}
