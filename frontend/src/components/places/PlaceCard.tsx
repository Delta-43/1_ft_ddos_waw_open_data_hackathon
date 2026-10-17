import { DataModeBadge, type DataMode } from '../provenance/DataModeBadge';
import type { Place } from './types';
import './places.css';

/** Readable coordinates; the data itself stays in GeoJSON longitude, latitude order. */
function formatCoordinates({ latitude, longitude }: Place): string {
  const lat = `${Math.abs(latitude).toFixed(4)}° ${latitude >= 0 ? 'N' : 'S'}`;
  const lng = `${Math.abs(longitude).toFixed(4)}° ${longitude >= 0 ? 'E' : 'W'}`;
  return `${lat}, ${lng}`;
}

export function PlaceCard({ place, mode }: { place: Place; mode: DataMode }) {
  return (
    <article className="place-card">
      <header className="place-card__header">
        <h3 className="place-card__name">{place.name}</h3>
        <DataModeBadge mode={mode} />
      </header>
      <dl className="place-card__details">
        <dt>Location</dt>
        <dd>{formatCoordinates(place)}</dd>
      </dl>
    </article>
  );
}
