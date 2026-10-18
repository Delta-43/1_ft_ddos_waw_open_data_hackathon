import { useEffect, useState } from 'react';
import type { InterpretedPreferences, Preferences } from '../../api/contract';
import './layout.css';

interface PreferenceChipsProps {
  /** What the backend understood; undefined before the first answer. */
  understood?: InterpretedPreferences;
  busy: boolean;
  onChange: (preferences: Preferences) => void;
}

const INTERPRETER_TEXT: Record<InterpretedPreferences['interpreted_by'], string> = {
  fixture: 'the demo fixture',
  rules: 'keyword rules',
  model: 'the AI model',
};

const ON = 0.8;
const HOUR_S = 3600;
const MIN_HOURS = 1;
const MAX_HOURS = 5;
/** Wait this long after the slider stops moving before re-planning. */
const SLIDER_SETTLE_MS = 600;

/**
 * The Preferences panel's contents (#114, after the reference "What matters today?" card): what the
 * backend understood, as toggles, a time slider and on foot / by bike. Each change re-sends the
 * same prompt with explicit preferences.
 */
export function PreferenceChips({ understood, busy, onChange }: PreferenceChipsProps) {
  const understoodHours = understood?.max_duration_s != null ? understood.max_duration_s / HOUR_S : null;
  const [hours, setHours] = useState<number | null>(understoodHours);

  // A new answer resets the slider to what was understood.
  useEffect(() => setHours(understoodHours), [understoodHours]);

  // Re-plan once the slider has settled on a new value.
  useEffect(() => {
    if (!understood || hours == null || hours === understoodHours) return;
    const timer = window.setTimeout(() => onChange({ ...explicit(understood), max_duration_s: Math.round(hours * HOUR_S) }), SLIDER_SETTLE_MS);
    return () => window.clearTimeout(timer);
  }, [hours]);

  if (!understood) {
    return (
      <div className="preferences-panel">
        <h2 className="corner__heading">What matters today?</h2>
        <p className="corner__text">Ask the assistant for an outing first. What it understood appears here, and you can change it.</p>
      </div>
    );
  }

  const toggle = (key: 'quiet' | 'green') => {
    const next = explicit(understood);
    next.priorities = { ...understood.priorities, [key]: understood.priorities[key] > 0 ? 0 : ON };
    onChange(next);
  };
  const quiet = understood.priorities.quiet > 0;
  const green = understood.priorities.green > 0;
  const shown = hours ?? MAX_HOURS;

  return (
    <div className="preferences-panel" aria-busy={busy}>
      <h2 className="corner__heading">What matters today?</h2>
      <div className="preference-chips">
        <button type="button" className="preference-chip" aria-pressed={quiet} disabled={busy} onClick={() => toggle('quiet')}>
          {quiet && '✓ '}Quiet
        </button>
        <button type="button" className="preference-chip" aria-pressed={green} disabled={busy} onClick={() => toggle('green')}>
          {green && '✓ '}Green
        </button>
        {understood.interests.map(interest => (
          <span key={interest} className="preference-chip preference-chip--static">{interest}</span>
        ))}
      </div>

      <label className="preferences-panel__row" htmlFor="preferences-hours">
        <span>Time for yourself</span>
        <strong>{hours == null ? 'No limit' : `${shown} ${shown === 1 ? 'hour' : 'hours'}`}</strong>
      </label>
      <input
        id="preferences-hours"
        className="preferences-panel__slider"
        type="range"
        min={MIN_HOURS}
        max={MAX_HOURS}
        step={0.5}
        value={shown}
        disabled={busy}
        onChange={event => setHours(Number(event.target.value))}
      />
      <div className="preferences-panel__scale" aria-hidden="true"><span>{MIN_HOURS} hour</span><span>{MAX_HOURS} hours</span></div>

      <div className="segmented" role="group" aria-label="Travel mode">
        {(['walk', 'bike'] as const).map(mode => (
          <button
            key={mode}
            type="button"
            className="segmented__option"
            aria-pressed={understood.travel_mode === mode}
            disabled={busy}
            onClick={() => understood.travel_mode !== mode && onChange({ ...explicit(understood), travel_mode: mode })}
          >
            {mode === 'walk' ? 'On foot' : 'By bike'}
          </button>
        ))}
      </div>

      <p className="corner__text">Understood by {INTERPRETER_TEXT[understood.interpreted_by]}. Your changes re-plan the same request; nothing is stored.</p>
    </div>
  );
}

function explicit(understood: InterpretedPreferences): Preferences {
  return {
    interests: understood.interests,
    travel_mode: understood.travel_mode,
    priorities: { ...understood.priorities },
    ...(understood.max_duration_s != null && { max_duration_s: understood.max_duration_s }),
  };
}
