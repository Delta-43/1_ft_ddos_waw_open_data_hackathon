import { Popup, type Map } from 'maplibre-gl';
import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { sourceFor, type Place, type Source } from '../api/contract';
import { PlaceCard } from '../components/places/PlaceCard';
import '../components/places/places.css';

/** The place card for a searched place, as a pop-up above it (like PlacePopup, without a route). */
export function SearchPopup({ map, place, sources, onClose }: { map: Map; place: Place; sources: Source[]; onClose: () => void }) {
  const container = useMemo(() => document.createElement('div'), []);
  const [, setMounted] = useState(false);

  useEffect(() => {
    const popup = new Popup({ offset: 14, maxWidth: '22rem', className: 'place-popup', focusAfterOpen: false })
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
    // Reopen only when the place changes, not when the parent hands over a new onClose.
  }, [map, place, container]);

  return createPortal(<PlaceCard place={place} source={sourceFor(sources, place.source_id)} selected />, container);
}
