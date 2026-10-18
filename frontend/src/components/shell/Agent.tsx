import { useEffect, useRef, useState, type CSSProperties, type FormEvent, type KeyboardEvent } from 'react';
import { sourceFor, type Route, type Source } from '../../api/contract';
import type { TrackResponse } from '../../api/tracks';
import { routeLetter } from '../../map/routeColours';
import type { RequestStatus } from '../../useOuting';
import { formatDistance, formatDuration } from '../places/format';
import { DataModeBadge } from '../provenance/DataModeBadge';
import { SourceLabel } from '../provenance/SourceLabel';
import { SourcesDrawer } from '../provenance/SourcesDrawer';
import { useT } from '../../i18n/useT';
import type { Key } from '../../i18n/translations';
import { MOODS, SUGGESTIONS, moodForTrack } from './moods';
import { Orb } from './Orb';

export type AgentPhase = 'home' | 'compose' | 'result';

interface AgentProps {
  phase: AgentPhase;
  status: RequestStatus;
  result: TrackResponse | null;
  aiTrackId?: string;
  selectedRouteId?: string;
  selectedPlaceId?: string;
  accent: string;
  sourcesOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
  /** Title of a closed trip whose route is still on the map; the orb can bring it back. */
  resumeTitle?: string;
  onResume: () => void;
  onAsk: (prompt: string) => void;
  onChooseTrack: (trackId: string) => void;
  onSelectRoute: (id: string) => void;
  onShowPlace: (placeId: string) => void;
  onToggleSources: () => void;
  onReset: () => void;
}

const PICKED_BY: Record<string, Key> = {
  model: 'shellPickedModel',
  keywords: 'shellPickedKeywords',
  user: 'shellPickedUser',
};
const CATEGORY: Record<string, Key> = { museum: 'categoryMuseum', landmark: 'categoryLandmark', park: 'categoryPark' };

/** The guide: an orb that asks, a bubble to answer in, and the trip it finds. */
export function Agent(props: AgentProps) {
  const t = useT();
  const { phase, status, result, accent } = props;
  const busy = status.state === 'loading';
  const orbState = busy ? 'thinking' : phase === 'compose' ? 'listening' : 'idle';
  const [minimised, setMinimised] = useState(false);

  // A new trip always opens the panel again.
  useEffect(() => setMinimised(false), [result]);

  const className = ['agent', `agent--${phase}`, busy && 'agent--busy', minimised && 'agent--minimised'].filter(Boolean).join(' ');
  return (
    <section className={className} style={{ '--accent': accent } as CSSProperties} aria-label={t('shellGuide')}>
      {phase === 'result' && result ? (
        <Trip {...props} result={result} busy={busy} minimised={minimised} onMinimise={setMinimised} orbState={orbState} />
      ) : (
        <>
          <button
            type="button"
            className="agent__orb"
            onClick={phase === 'home' ? props.onOpen : props.onClose}
            aria-label={phase === 'home' ? t('shellTalk') : t('shellClose')}
            aria-expanded={phase !== 'home'}
          >
            <Orb state={orbState} accent={accent} />
          </button>
          <div className="agent__bubble">
            {phase === 'home' ? (
              <button type="button" className="agent__greeting" onClick={props.onOpen}>
                <span className="agent__question">{t('shellGreeting')}</span>
                <span className="agent__hint">
                  <span>{props.resumeTitle ? <>{t('shellResumePick')} <em>{props.resumeTitle}</em>{t('shellResumeOr')}</> : t('shellGreetingHint')}</span>
                  <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3 8h9.5M8.5 4l4 4-4 4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </span>
              </button>
            ) : (
              <Compose
                busy={busy}
                error={status.state === 'error' ? status.message : undefined}
                resumeTitle={props.resumeTitle}
                onResume={props.onResume}
                onAsk={props.onAsk}
                onClose={props.onClose}
              />
            )}
          </div>
        </>
      )}
    </section>
  );
}

interface ComposeProps {
  busy: boolean;
  error?: string;
  resumeTitle?: string;
  onResume: () => void;
  onAsk: (prompt: string) => void;
  onClose: () => void;
}

function Compose({ busy, error, resumeTitle, onResume, onAsk, onClose }: ComposeProps) {
  const t = useT();
  const [text, setText] = useState('');
  const input = useRef<HTMLTextAreaElement>(null);
  useEffect(() => input.current?.focus(), []);

  function submit(event?: FormEvent) {
    event?.preventDefault();
    const prompt = text.trim();
    if (busy) return;
    // Nothing typed: carry on with the last trip, if there is one.
    if (prompt) onAsk(prompt);
    else if (resumeTitle) onResume();
  }

  function onKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Enter' && !event.shiftKey) submit(event);
    if (event.key === 'Escape') onClose();
  }

  return (
    <form className="compose" onSubmit={submit}>
      <p className="compose__question" id="compose-question">{t('shellGreeting')}</p>
      <div className="compose__field">
        <textarea
          ref={input}
          className="compose__input"
          rows={2}
          maxLength={1000}
          value={text}
          onChange={event => setText(event.target.value)}
          onKeyDown={onKeyDown}
          placeholder={t('shellPlaceholder')}
          aria-labelledby="compose-question"
          disabled={busy}
        />
        <button
          type="submit"
          className="compose__send"
          disabled={busy || (!text.trim() && !resumeTitle)}
          aria-label={text.trim() || !resumeTitle ? t('shellFindMyWay') : t('shellResumeLabel', { title: resumeTitle })}
        >
          <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M4 10h11m-4.5-4.5L15 10l-4.5 4.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </button>
      </div>
      {busy ? (
        <p className="compose__status" role="status">{t('shellFinding')}</p>
      ) : error ? (
        <p className="compose__error" role="alert">{error}</p>
      ) : (
        <ul className="compose__suggestions" aria-label={t('shellIdeas')}>
          {resumeTitle && (
            <li className="compose__resume-item">
              <button type="button" className="compose__resume" onClick={onResume}>
                <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M6 3.5 2.5 7 6 10.5M3 7h6.5a4 4 0 0 1 0 8H8" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                <span>{t('shellBackTo')} <strong>{resumeTitle}</strong></span>
              </button>
            </li>
          )}
          {SUGGESTIONS.map(suggestion => (
            <li key={suggestion.label}>
              <button type="button" className="compose__suggestion" onClick={() => onAsk(suggestion.query)}>{t(suggestion.label)}</button>
            </li>
          ))}
        </ul>
      )}
    </form>
  );
}

interface TripProps extends AgentProps {
  result: TrackResponse;
  busy: boolean;
  minimised: boolean;
  onMinimise: (value: boolean) => void;
  orbState: 'idle' | 'listening' | 'thinking';
}

function Trip({ result, busy, minimised, onMinimise, orbState, accent, status, aiTrackId, selectedRouteId, selectedPlaceId, sourcesOpen, ...actions }: TripProps) {
  const t = useT();
  const [details, setDetails] = useState(false);
  const [tweak, setTweak] = useState('');
  const route = result.routes.find(candidate => candidate.id === selectedRouteId) ?? result.routes[0];
  const track = result.track;
  const activeMood = moodForTrack(track?.id);

  if (!route) {
    return (
      <div className="trip">
        <TripHeader title={t('shellNoRoute')} sub={t('shellNoRouteSub')} orbState={orbState} accent={accent} onReset={actions.onReset} />
      </div>
    );
  }

  if (minimised) {
    return (
      <button type="button" className="trip-pill" onClick={() => onMinimise(false)} aria-label={t('shellShowTrip', { title: track?.title ?? route.name })}>
        <Orb state={orbState} accent={accent} />
        <span className="trip-pill__text">{track?.title ?? route.name}</span>
        <span className="trip-pill__meta">{formatDuration(route.metrics.duration_s.value)}</span>
      </button>
    );
  }

  const stops = [...route.stops].sort((a, b) => a.order - b.order);
  const places = new Map(route.places.map(place => [place.id, place]));
  const startName = result.mode === 'mock' ? t('shellDemoStart') : 'Centrum';
  const pickedBy = track ? t(PICKED_BY[track.picked_by] ?? 'shellPickedModel') : undefined;

  function submitTweak(event: FormEvent) {
    event.preventDefault();
    const prompt = tweak.trim();
    if (!prompt || busy) return;
    actions.onAsk(prompt);
    setTweak('');
  }

  return (
    <div className="trip" aria-busy={busy}>
      <TripHeader
        title={track?.title ?? route.name}
        sub={track?.reason && track.picked_by === 'model' ? track.reason : track?.summary}
        tag={pickedBy}
        orbState={orbState}
        accent={accent}
        onMinimise={() => onMinimise(true)}
        onReset={actions.onReset}
      />

      <div className="trip__stats">
        <span className="trip__stat trip__stat--big">{formatDuration(route.metrics.duration_s.value)}</span>
        <span className="trip__stat">{formatDistance(route.metrics.distance_m.value)}</span>
        <span className="trip__stat">{route.travel_mode === 'bike' ? t('shellByBike') : t('shellOnFoot')}</span>
        {route.geometry_kind === 'straight_line' && <span className="trip__warning">{t('shellStraightLine')}</span>}
      </div>

      <ol className="journey" aria-label={t('shellYourWay')}>
        <li className="journey__row journey__row--start">
          <span className="journey__dot" aria-hidden="true" />
          <span className="journey__text">
            <span className="journey__label">{t('shellFrom')}</span>
            <span className="journey__name">{startName}</span>
          </span>
          <span className="journey__note journey__note--plain">{t('shellFixedStart')}</span>
        </li>
        {stops.map((stop, index) => {
          const place = places.get(stop.place_id);
          if (!place) return null;
          const last = index === stops.length - 1;
          return (
            <li key={stop.place_id} className={`journey__row${last ? ' journey__row--end' : ''}`}>
              <span className="journey__dot" aria-hidden="true">{stop.order}</span>
              <button
                type="button"
                className={`journey__place${selectedPlaceId === place.id ? ' journey__place--active' : ''}`}
                onClick={() => actions.onShowPlace(place.id)}
                aria-pressed={selectedPlaceId === place.id}
              >
                <span className="journey__label">{last ? t('shellTo') : t('shellStopN', { n: stop.order })}</span>
                <span className="journey__name">{place.name}</span>
              </button>
              <span className="journey__note">{CATEGORY[place.category] ? t(CATEGORY[place.category]) : ''}</span>
            </li>
          );
        })}
      </ol>

      <fieldset className="moods" disabled={busy}>
        <legend className="moods__legend">
          {t('shellMood')}
          <span className="moods__who">{activeMood && activeMood.trackId === aiTrackId ? t('shellSuggestedByAi') : activeMood ? t('shellSetByYou') : ''}</span>
        </legend>
        <div className="moods__list">
          {MOODS.map(mood => {
            const active = mood.trackId === track?.id;
            return (
              <button
                key={mood.id}
                type="button"
                className={`mood${active ? ' mood--active' : ''}`}
                style={{ '--mood': mood.accent } as CSSProperties}
                aria-pressed={active}
                title={t(mood.hint)}
                onClick={() => !active && actions.onChooseTrack(mood.trackId)}
              >
                <span className="mood__swatch" aria-hidden="true" />
                {t(mood.label)}
                {mood.trackId === aiTrackId && <span className="mood__ai" title={t('shellAiSuggestion')}>AI</span>}
              </button>
            );
          })}
        </div>
      </fieldset>

      {result.routes.length > 1 && (
        <RoutePicker routes={result.routes} selectedId={route.id} onSelect={actions.onSelectRoute} />
      )}

      {status.state === 'error' && <p className="trip__error" role="alert">{status.message}</p>}

      <button type="button" className="trip__more" aria-expanded={details} onClick={() => setDetails(open => !open)}>
        {details ? t('shellLess') : t('shellWhy')}
        <svg viewBox="0 0 12 12" aria-hidden="true"><path d="M3 4.5 6 7.5l3-3" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
      </button>
      {details && <TripDetails route={route} sources={result.sources} />}

      <form className="tweak" onSubmit={submitTweak}>
        <input
          className="tweak__input"
          value={tweak}
          onChange={event => setTweak(event.target.value)}
          placeholder={t('shellAskElse')}
          aria-label={t('shellAskElseLabel')}
          maxLength={1000}
          disabled={busy}
        />
        <button type="submit" className="tweak__send" disabled={busy || !tweak.trim()} aria-label={t('shellAsk')}>
          <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M4 10h11m-4.5-4.5L15 10l-4.5 4.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </button>
      </form>

      <footer className="trip__footer">
        <DataModeBadge mode={result.mode} />
        {track?.simulated && <span className="trip__tag" title={t('shellDemoTrackTitle')}>{t('shellDemoTrack')}</span>}
        {route.geometry_kind === 'street' && <span className="trip__tag" title={t('shellStreetRouteTitle')}>{t('shellStreetRoute')}</span>}
        <button type="button" className="trip__sources" onClick={actions.onToggleSources} aria-expanded={sourcesOpen} aria-controls="sources-drawer">
          {t('sources')}
        </button>
      </footer>
      <SourcesDrawer id="sources-drawer" sources={result.sources} notice={result.notice} hidden={!sourcesOpen} />
    </div>
  );
}

function TripHeader({ title, sub, tag, orbState, accent, onMinimise, onReset }: {
  title: string;
  sub?: string;
  tag?: string;
  orbState: 'idle' | 'listening' | 'thinking';
  accent: string;
  onMinimise?: () => void;
  onReset: () => void;
}) {
  const t = useT();
  return (
    <header className="trip__header">
      <Orb state={orbState} accent={accent} />
      <div className="trip__heading">
        <h2 className="trip__title">{title}</h2>
        {(tag || sub) && (
          <p className="trip__sub">
            {tag && <span className="trip__picked">{tag}</span>}
            {sub}
          </p>
        )}
      </div>
      <div className="trip__actions">
        {onMinimise && (
          <button type="button" className="icon-button" onClick={onMinimise} aria-label={t('shellMinimise')}>
            <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4 8h8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>
          </button>
        )}
        <button type="button" className="icon-button" onClick={onReset} aria-label={t('shellCloseKeep')}>
          <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4.5 4.5l7 7m0-7-7 7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>
        </button>
      </div>
    </header>
  );
}

function RoutePicker({ routes, selectedId, onSelect }: { routes: Route[]; selectedId: string; onSelect: (id: string) => void }) {
  const t = useT();
  const ranked = [...routes].sort((a, b) => a.rank - b.rank);
  return (
    <div className="route-picker" role="group" aria-label={t('shellChooseWay')}>
      {ranked.map(route => (
        <button
          key={route.id}
          type="button"
          className={`route-picker__option${route.id === selectedId ? ' route-picker__option--active' : ''}`}
          aria-pressed={route.id === selectedId}
          onClick={() => onSelect(route.id)}
        >
          <span className="route-picker__letter" aria-hidden="true">{routeLetter(ranked, route.id)}</span>
          <span className="route-picker__name">{route.name}</span>
          <span className="route-picker__meta">{formatDuration(route.metrics.duration_s.value)}</span>
        </button>
      ))}
    </div>
  );
}

function TripDetails({ route, sources }: { route: Route; sources: Source[] }) {
  const t = useT();
  const scores = [
    { label: t('shellGreenery'), metric: route.metrics.green_score },
    { label: t('shellQuiet'), metric: route.metrics.quiet_score },
  ];
  return (
    <div className="trip__details">
      <p className="trip__explanation">{route.explanation}</p>
      <dl className="scores">
        {scores.map(({ label, metric }) => (
          <div key={label} className="scores__row">
            <dt className="scores__label">{label}</dt>
            <dd className="scores__value">
              <span className="scores__bar" aria-hidden="true"><span style={{ width: `${Math.round((metric.value ?? 0) * 100)}%` }} /></span>
              <span className="scores__number">{metric.value == null ? 'unknown' : `${Math.round(metric.value * 100)}%`}</span>
              <SourceLabel source={sourceFor(sources, metric.source_id)} compact />
            </dd>
          </div>
        ))}
      </dl>
      <p className="trip__fine">{t('shellScoresNote')}</p>
      <ul className="legend" aria-label={t('shellOnMap')}>
        <li><span className="legend__swatch legend__swatch--route" aria-hidden="true" />{t('shellYourWay')}</li>
        <li><span className="legend__swatch legend__swatch--culture" aria-hidden="true" />{t('shellLegendCulture')}</li>
        <li><span className="legend__swatch legend__swatch--green" aria-hidden="true" />{t('shellLegendGreen')}</li>
        <li><span className="legend__swatch legend__swatch--stop" aria-hidden="true" />{t('shellLegendTransit')}</li>
      </ul>
      <p className="trip__fine">{t('shellNoteTransit')}</p>
      <p className="trip__fine">{t('shellNote3d')}</p>
    </div>
  );
}
