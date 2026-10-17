import type { PlaceCategory, Source } from '../../api/contract';
import { SourceLabel } from '../provenance/SourceLabel';
import { formatDuration } from './format';
import type { Place, Stop } from './types';
import './places.css';

const CATEGORY_TEXT: Record<PlaceCategory, string> = {
  museum: 'Museum',
  landmark: 'Landmark',
  park: 'Park',
  generic: 'Place',
};

/** Short link text for a website; falls back to the raw value if it isn't a valid URL. */
function websiteLabel(website: string): string {
  try {
    return new URL(website).hostname.replace(/^www\./, '');
  } catch {
    return website;
  }
}

interface PlaceCardProps {
  place: Place;
  /** The place's source, looked up from the response's `sources` by `place.source_id`. */
  source?: Source;
  /** Present when the card is a stop on a route. */
  stop?: Stop;
  selected?: boolean;
  /** Opens this place's pop-up on the map. */
  onShowOnMap?: () => void;
}

export function PlaceCard({ place, source, stop, selected = false, onShowOnMap }: PlaceCardProps) {
  return (
    <article className={`place-card${selected ? ' place-card--selected' : ''}`}>
      <header className="place-card__header">
        {stop && <span className="place-card__order" aria-label={`Stop ${stop.order}`}>{stop.order}</span>}
        <div className="place-card__heading">
          <h3 className="place-card__name">{place.name}</h3>
          <span className="place-card__category">{CATEGORY_TEXT[place.category] ?? CATEGORY_TEXT.generic}</span>
        </div>
      </header>
      <SourceLabel source={source} />
      {place.summary && <p className="place-card__summary">{place.summary}</p>}
      <dl className="place-card__details">
        {stop && (
          <>
            <dt>Arrive</dt>
            <dd>{formatDuration(stop.arrival_offset_s, '+')}</dd>
            <dt>Visit</dt>
            <dd>{formatDuration(stop.visit_duration_s)}</dd>
          </>
        )}
        <dt>Opening hours</dt>
        <dd className={place.opening_hours ? 'place-card__hours' : undefined}>{place.opening_hours ?? 'Unknown'}</dd>
        {place.address && (
          <>
            <dt>Address</dt>
            <dd>{place.address}</dd>
          </>
        )}
        {place.website && (
          <>
            <dt>Website</dt>
            <dd><a href={place.website} target="_blank" rel="noreferrer">{websiteLabel(place.website)}</a></dd>
          </>
        )}
      </dl>
      {onShowOnMap && (
        <button type="button" className="place-card__show" onClick={onShowOnMap} aria-pressed={selected}>
          Show on map
        </button>
      )}
    </article>
  );
}
