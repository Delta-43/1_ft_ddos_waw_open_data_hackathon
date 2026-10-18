import type { PlaceCategory, Source } from '../../api/contract';
import { useT } from '../../i18n/useT';
import type { Key } from '../../i18n/translations';
import { SourceLabel } from '../provenance/SourceLabel';
import { formatDuration } from './format';
import type { Place, Stop } from './types';
import './places.css';

const CATEGORY_KEY: Record<PlaceCategory, Key> = {
  museum: 'categoryMuseum',
  landmark: 'categoryLandmark',
  park: 'categoryPark',
  generic: 'categoryGeneric',
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
  const t = useT();
  return (
    <article className={`place-card${selected ? ' place-card--selected' : ''}`}>
      <header className="place-card__header">
        {stop && <span className="place-card__order" aria-label={t('stopAriaLabel', { order: stop.order })}>{stop.order}</span>}
        <div className="place-card__heading">
          <h3 className="place-card__name">{place.name}</h3>
          <span className="place-card__category">{t(CATEGORY_KEY[place.category] ?? CATEGORY_KEY.generic)}</span>
        </div>
      </header>
      <SourceLabel source={source} />
      {place.summary && <p className="place-card__summary">{place.summary}</p>}
      <dl className="place-card__details">
        {stop && (
          <>
            <dt>{t('arrive')}</dt>
            <dd>{formatDuration(stop.arrival_offset_s, '+')}</dd>
            <dt>{t('visit')}</dt>
            <dd>{formatDuration(stop.visit_duration_s)}</dd>
          </>
        )}
        <dt>{t('openingHours')}</dt>
        <dd className={place.opening_hours ? 'place-card__hours' : undefined}>{place.opening_hours ?? t('unknown')}</dd>
        {place.address && (
          <>
            <dt>{t('address')}</dt>
            <dd>{place.address}</dd>
          </>
        )}
        {place.website && (
          <>
            <dt>{t('website')}</dt>
            <dd><a href={place.website} target="_blank" rel="noreferrer">{websiteLabel(place.website)}</a></dd>
          </>
        )}
      </dl>
      {onShowOnMap && (
        <button type="button" className="place-card__show" onClick={onShowOnMap} aria-pressed={selected}>
          {t('showOnMap')}
        </button>
      )}
    </article>
  );
}
