import { useEffect, useRef, useState, type CSSProperties, type FormEvent, type KeyboardEvent } from 'react';
import { sourceFor, type Route, type Source } from '../../api/contract';
import type { TrackResponse } from '../../api/tracks';
import { routeLetter } from '../../map/routeColours';
import type { RequestStatus } from '../../useOuting';
import { formatDistance, formatDuration } from '../places/format';
import { DataModeBadge } from '../provenance/DataModeBadge';
import { SourceLabel } from '../provenance/SourceLabel';
import { SourcesDrawer } from '../provenance/SourcesDrawer';
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
  onAsk: (prompt: string) => void;
  onChooseTrack: (trackId: string) => void;
  onSelectRoute: (id: string) => void;
  onShowPlace: (placeId: string) => void;
  onToggleSources: () => void;
  onReset: () => void;
}

const PICKED_BY: Record<string, string> = {
  model: 'Picked by AI',
  keywords: 'Matched by keywords',
  user: 'Your pick',
};

/** The guide: an orb that asks, a bubble to answer in, and the trip it finds. */
export function Agent(props: AgentProps) {
  const { phase, status, result, accent } = props;
  const busy = status.state === 'loading';
  const orbState = busy ? 'thinking' : phase === 'compose' ? 'listening' : 'idle';
  const [minimised, setMinimised] = useState(false);

  // A new trip always opens the panel again.
  useEffect(() => setMinimised(false), [result]);

  const className = ['agent', `agent--${phase}`, busy && 'agent--busy', minimised && 'agent--minimised'].filter(Boolean).join(' ');
  return (
    <section className={className} style={{ '--accent': accent } as CSSProperties} aria-label="Your guide">
      {phase === 'result' && result ? (
        <Trip {...props} result={result} busy={busy} minimised={minimised} onMinimise={setMinimised} orbState={orbState} />
      ) : (
        <>
          <button
            type="button"
            className="agent__orb"
            onClick={phase === 'home' ? props.onOpen : props.onClose}
            aria-label={phase === 'home' ? 'Talk to your guide' : 'Close'}
            aria-expanded={phase !== 'home'}
          >
            <Orb state={orbState} accent={accent} />
          </button>
          <div className="agent__bubble">
            {phase === 'home' ? (
              <button type="button" className="agent__greeting" onClick={props.onOpen}>
                <span className="agent__question">Where’re we feeling today?</span>
                <span className="agent__hint">Tell me a mood, a place or how long you have</span>
              </button>
            ) : (
              <Compose busy={busy} error={status.state === 'error' ? status.message : undefined} onAsk={props.onAsk} onClose={props.onClose} />
            )}
          </div>
        </>
      )}
    </section>
  );
}

function Compose({ busy, error, onAsk, onClose }: { busy: boolean; error?: string; onAsk: (prompt: string) => void; onClose: () => void }) {
  const [text, setText] = useState('');
  const input = useRef<HTMLTextAreaElement>(null);
  useEffect(() => input.current?.focus(), []);

  function submit(event?: FormEvent) {
    event?.preventDefault();
    const prompt = text.trim();
    if (prompt && !busy) onAsk(prompt);
  }

  function onKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Enter' && !event.shiftKey) submit(event);
    if (event.key === 'Escape') onClose();
  }

  return (
    <form className="compose" onSubmit={submit}>
      <p className="compose__question" id="compose-question">Where’re we feeling today?</p>
      <div className="compose__field">
        <textarea
          ref={input}
          className="compose__input"
          rows={2}
          maxLength={1000}
          value={text}
          onChange={event => setText(event.target.value)}
          onKeyDown={onKeyDown}
          placeholder="A slow walk through a park to a small museum…"
          aria-labelledby="compose-question"
          disabled={busy}
        />
        <button type="submit" className="compose__send" disabled={busy || !text.trim()} aria-label="Find my way">
          <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M4 10h11m-4.5-4.5L15 10l-4.5 4.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </button>
      </div>
      {busy ? (
        <p className="compose__status" role="status">Finding your way…</p>
      ) : error ? (
        <p className="compose__error" role="alert">{error}</p>
      ) : (
        <ul className="compose__suggestions" aria-label="Ideas">
          {SUGGESTIONS.map(suggestion => (
            <li key={suggestion}>
              <button type="button" className="compose__suggestion" onClick={() => onAsk(suggestion)}>{suggestion}</button>
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
  const [details, setDetails] = useState(false);
  const [tweak, setTweak] = useState('');
  const route = result.routes.find(candidate => candidate.id === selectedRouteId) ?? result.routes[0];
  const track = result.track;
  const activeMood = moodForTrack(track?.id);

  if (!route) {
    return (
      <div className="trip">
        <TripHeader title="No route this time" sub="Nothing matched. Try a longer time or a different mood." orbState={orbState} accent={accent} onReset={actions.onReset} />
      </div>
    );
  }

  if (minimised) {
    return (
      <button type="button" className="trip-pill" onClick={() => onMinimise(false)} aria-label={`Show trip: ${track?.title ?? route.name}`}>
        <Orb state={orbState} accent={accent} />
        <span className="trip-pill__text">{track?.title ?? route.name}</span>
        <span className="trip-pill__meta">{formatDuration(route.metrics.duration_s.value)}</span>
      </button>
    );
  }

  const stops = [...route.stops].sort((a, b) => a.order - b.order);
  const places = new Map(route.places.map(place => [place.id, place]));
  const startName = result.mode === 'mock' ? 'Demo start' : 'Centrum';
  const pickedBy = track ? PICKED_BY[track.picked_by] ?? 'Picked' : undefined;

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
        <span className="trip__stat">{route.travel_mode === 'bike' ? 'by bike' : 'on foot'}</span>
        {route.geometry_kind === 'straight_line' && <span className="trip__warning">Straight-line sketch, not directions</span>}
      </div>

      <ol className="journey" aria-label="Your way">
        <li className="journey__row journey__row--start">
          <span className="journey__dot" aria-hidden="true" />
          <span className="journey__text">
            <span className="journey__label">From</span>
            <span className="journey__name">{startName}</span>
          </span>
          <span className="journey__note journey__note--plain">fixed demo start</span>
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
                <span className="journey__label">{last ? 'To' : `Stop ${stop.order}`}</span>
                <span className="journey__name">{place.name}</span>
              </button>
              <span className="journey__note">{place.category === 'generic' ? '' : place.category}</span>
            </li>
          );
        })}
      </ol>

      <fieldset className="moods" disabled={busy}>
        <legend className="moods__legend">
          Mood
          <span className="moods__who">{activeMood && activeMood.trackId === aiTrackId ? 'suggested by AI' : activeMood ? 'set by you' : ''}</span>
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
                title={mood.hint}
                onClick={() => !active && actions.onChooseTrack(mood.trackId)}
              >
                <span className="mood__swatch" aria-hidden="true" />
                {mood.label}
                {mood.trackId === aiTrackId && <span className="mood__ai" title="The AI's suggestion">AI</span>}
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
        {details ? 'Less' : 'Why this way'}
        <svg viewBox="0 0 12 12" aria-hidden="true"><path d="M3 4.5 6 7.5l3-3" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
      </button>
      {details && <TripDetails route={route} sources={result.sources} />}

      <form className="tweak" onSubmit={submitTweak}>
        <input
          className="tweak__input"
          value={tweak}
          onChange={event => setTweak(event.target.value)}
          placeholder="Ask for something else…"
          aria-label="Ask for a different outing"
          maxLength={1000}
          disabled={busy}
        />
        <button type="submit" className="tweak__send" disabled={busy || !tweak.trim()} aria-label="Ask">
          <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M4 10h11m-4.5-4.5L15 10l-4.5 4.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </button>
      </form>

      <footer className="trip__footer">
        <DataModeBadge mode={result.mode} />
        {track?.simulated && <span className="trip__tag" title="The places on this way are predefined for the demo; the street route is computed.">Demo track</span>}
        <button type="button" className="trip__sources" onClick={actions.onToggleSources} aria-expanded={sourcesOpen} aria-controls="sources-drawer">
          Sources
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
  return (
    <header className="trip__header">
      <Orb state={orbState} accent={accent} />
      <div className="trip__heading">
        {tag && <span className="trip__picked">{tag}</span>}
        <h2 className="trip__title">{title}</h2>
        {sub && <p className="trip__sub">{sub}</p>}
      </div>
      <div className="trip__actions">
        {onMinimise && (
          <button type="button" className="icon-button" onClick={onMinimise} aria-label="Minimise">
            <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4 8h8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>
          </button>
        )}
        <button type="button" className="icon-button" onClick={onReset} aria-label="Start over">
          <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4.5 4.5l7 7m0-7-7 7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>
        </button>
      </div>
    </header>
  );
}

function RoutePicker({ routes, selectedId, onSelect }: { routes: Route[]; selectedId: string; onSelect: (id: string) => void }) {
  const ranked = [...routes].sort((a, b) => a.rank - b.rank);
  return (
    <div className="route-picker" role="group" aria-label="Choose a way">
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
  const scores = [
    { label: 'Greenery', metric: route.metrics.green_score },
    { label: 'Quiet', metric: route.metrics.quiet_score },
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
      <p className="trip__fine">Greenery and quiet are estimates from map data, not measurements.</p>
    </div>
  );
}
