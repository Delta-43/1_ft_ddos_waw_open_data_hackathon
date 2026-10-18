import { sourceFor, type ResponseMode, type Source } from '../../api/contract';
import { useT } from '../../i18n/useT';
import type { DataMode } from '../provenance/DataModeBadge';
import { PlaceCard } from './PlaceCard';
import type { Place, Stop } from './types';
import './places.css';

interface PlaceCardListProps {
  places: Place[];
  /** Response-level mode; kept for callers that don't pass `sources` yet. */
  mode: ResponseMode | DataMode;
  routeName?: string;
  /** The response's `sources`, so each card can show its own provenance (DATA-08). */
  sources?: Source[];
  /** The route's stops; when given, cards follow visit order and show timings. */
  stops?: Stop[];
  /** The place whose pop-up is open on the map. */
  selectedPlaceId?: string;
  onShowOnMap?: (placeId: string) => void;
}

/** Cards for one route's stops, in visit order when stops are known. */
export function PlaceCardList({ places, routeName, sources = [], stops, selectedPlaceId, onShowOnMap }: PlaceCardListProps) {
  const t = useT();
  const heading = routeName ? t('stopsOnRoute', { name: routeName }) : t('stops');
  const byId = new Map(places.map(place => [place.id, place]));
  const ordered = stops
    ? [...stops].sort((a, b) => a.order - b.order).flatMap(stop => {
        const place = byId.get(stop.place_id);
        return place ? [{ place, stop }] : [];
      })
    : places.map(place => ({ place, stop: undefined }));

  return (
    <section className="place-card-list" aria-label={heading}>
      <h2 className="place-card-list__heading">{heading}</h2>
      {ordered.length === 0 ? (
        <p className="place-card-list__empty">{t('noStopsYet')}</p>
      ) : (
        <ol className="place-card-list__items">
          {ordered.map(({ place, stop }) => (
            <li key={place.id}>
              <PlaceCard
                place={place}
                stop={stop}
                source={sourceFor(sources, place.source_id)}
                selected={place.id === selectedPlaceId}
                onShowOnMap={onShowOnMap && (() => onShowOnMap(place.id))}
              />
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
