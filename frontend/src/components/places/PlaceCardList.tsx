import { sourceFor, type ResponseMode, type Source } from '../../api/contract';
import type { DataMode } from '../provenance/DataModeBadge';
import { PlaceCard } from './PlaceCard';
import type { Place, Stop } from './types';

interface PlaceCardListProps {
  places: Place[];
  /** Response-level mode; kept for callers that don't pass `sources` yet. */
  mode: ResponseMode | DataMode;
  routeName?: string;
  /** The response's `sources`, so each card can show its own provenance (DATA-08). */
  sources?: Source[];
  /** The route's stops; when given, cards follow visit order and show timings. */
  stops?: Stop[];
}

/** Cards for one route's stops, in visit order when stops are known. */
export function PlaceCardList({ places, routeName, sources = [], stops }: PlaceCardListProps) {
  const heading = routeName ? `Stops on ${routeName}` : 'Stops';
  const byId = new Map(places.map(place => [place.id, place]));
  const ordered = stops
    ? [...stops].sort((a, b) => a.order - b.order).flatMap(stop => {
        const place = byId.get(stop.place_id);
        return place ? [{ place, stop }] : [];
      })
    : places.map(place => ({ place, stop: undefined }));

  return (
    <section className="grid gap-2" aria-label={heading}>
      <h2 className="text-moon-10-caption uppercase font-medium text-trunks">{heading}</h2>
      {ordered.length === 0 ? (
        <p className="text-moon-14 text-trunks">This route has no stops yet.</p>
      ) : (
        <ol className="grid gap-2">
          {ordered.map(({ place, stop }) => (
            <li key={place.id}>
              <PlaceCard place={place} stop={stop} source={sourceFor(sources, place.source_id)} />
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
