import type { PlaceCategory, Source } from '../../api/contract';
import { SourceLabel } from '../provenance/SourceLabel';
import { formatDuration } from './format';
import type { Place, Stop } from './types';

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
}

export function PlaceCard({ place, source, stop, selected = false }: PlaceCardProps) {
  return (
    <article
      className={`flex flex-col gap-2 px-4 py-3 rounded-moon-s-md bg-gohan text-bulma ring-1 ring-inset transition-shadow ${selected
        ? 'ring-piccolo shadow-moon-md'
        : 'ring-beerus'}`}
    >
      <header className="flex items-start gap-3">
        {stop && (
          <span
            className="flex-none grid place-items-center size-6 rounded-full bg-piccolo text-goten text-moon-12 font-semibold tabular-nums"
            aria-label={`Stop ${stop.order}`}
          >
            {stop.order}
          </span>
        )}
        <div className="flex flex-col gap-0.5 min-w-0">
          <h3 className={`text-moon-16 break-words ${selected ? 'font-bold' : 'font-semibold'}`}>{place.name}</h3>
          <span className="text-moon-12 text-trunks">{CATEGORY_TEXT[place.category] ?? CATEGORY_TEXT.generic}</span>
        </div>
      </header>
      <SourceLabel source={source} />
      {place.summary && <p className="text-moon-14">{place.summary}</p>}
      <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-moon-12 [&_dt]:text-trunks [&_dd]:tabular-nums [&_dd]:break-words">
        {stop && (
          <>
            <dt>Arrive</dt>
            <dd>{formatDuration(stop.arrival_offset_s, '+')}</dd>
            <dt>Visit</dt>
            <dd>{formatDuration(stop.visit_duration_s)}</dd>
          </>
        )}
        <dt>Opening hours</dt>
        <dd>{place.opening_hours ?? 'Unknown'}</dd>
        {place.address && (
          <>
            <dt>Address</dt>
            <dd>{place.address}</dd>
          </>
        )}
        {place.website && (
          <>
            <dt>Website</dt>
            <dd><a className="text-bulma underline underline-offset-2 hover:text-trunks" href={place.website} target="_blank" rel="noreferrer">{websiteLabel(place.website)}</a></dd>
          </>
        )}
      </dl>
    </article>
  );
}
