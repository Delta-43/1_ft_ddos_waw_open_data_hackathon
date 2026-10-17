import type { InterpretedPreferences, Preferences } from '../../api/contract';
import './layout.css';

interface PreferenceChipsProps {
  understood: InterpretedPreferences;
  busy: boolean;
  onChange: (preferences: Preferences) => void;
}

const INTERPRETER_TEXT: Record<InterpretedPreferences['interpreted_by'], string> = {
  fixture: 'demo fixture',
  rules: 'keyword rules',
  model: 'AI model',
};

const ON = 0.8;

/**
 * What the backend understood, as toggles in the nav bar (like Language Explorer's filter tabs).
 * Each change re-sends the same prompt with explicit preferences.
 */
export function PreferenceChips({ understood, busy, onChange }: PreferenceChipsProps) {
  const explicit = (): Preferences => ({
    interests: understood.interests,
    travel_mode: understood.travel_mode,
    priorities: { ...understood.priorities },
    ...(understood.max_duration_s != null && { max_duration_s: understood.max_duration_s }),
  });
  const toggle = (key: 'quiet' | 'green') => {
    const next = explicit();
    next.priorities = { ...understood.priorities, [key]: understood.priorities[key] > 0 ? 0 : ON };
    onChange(next);
  };
  const quiet = understood.priorities.quiet > 0;
  const green = understood.priorities.green > 0;
  const hours = understood.max_duration_s != null ? Math.round(understood.max_duration_s / 360) / 10 : null;

  return (
    <div className="preference-chips" role="group" aria-label="Understood preferences" aria-busy={busy}>
      {understood.interests.map(interest => (
        <span key={interest} className="preference-chip preference-chip--static">{interest}</span>
      ))}
      <button
        type="button"
        className="preference-chip"
        aria-pressed={understood.travel_mode === 'walk'}
        disabled={busy}
        onClick={() => onChange({ ...explicit(), travel_mode: understood.travel_mode === 'walk' ? 'bike' : 'walk' })}
        title="Switch between walking and cycling"
      >
        {understood.travel_mode === 'walk' ? 'Walk' : 'Bike'}
      </button>
      <button type="button" className="preference-chip" aria-pressed={quiet} disabled={busy} onClick={() => toggle('quiet')}>
        Quiet
      </button>
      <button type="button" className="preference-chip" aria-pressed={green} disabled={busy} onClick={() => toggle('green')}>
        Green
      </button>
      <span className="preference-chip preference-chip--static">{hours != null ? `≤ ${hours} h` : 'No time limit'}</span>
      <span className="preference-chips__by">Understood by {INTERPRETER_TEXT[understood.interpreted_by]}</span>
    </div>
  );
}
