import type { DataMode } from '../provenance/DataModeBadge';
import { PlaceCard } from './PlaceCard';
import type { Place } from './types';
import './places.css';

interface PlaceCardListProps {
  places: Place[];
  /** Response-level mode; every card shows it until per-place provenance exists (DATA-08). */
  mode: DataMode;
  routeName?: string;
}

/** Cards for one route's stops, in route order. */
export function PlaceCardList({ places, mode, routeName }: PlaceCardListProps) {
  const heading = routeName ? `Stops on ${routeName}` : 'Stops';
  if (places.length === 0) {
    return (
      <section className="place-card-list" aria-label={heading}>
        <h2 className="place-card-list__heading">{heading}</h2>
        <p className="place-card-list__empty">This route has no stops yet.</p>
      </section>
    );
  }
  return (
    <section className="place-card-list" aria-label={heading}>
      <h2 className="place-card-list__heading">{heading}</h2>
      <ol className="place-card-list__items">
        {places.map(place => (
          <li key={place.id}>
            <PlaceCard place={place} mode={mode} />
          </li>
        ))}
      </ol>
    </section>
  );
}
