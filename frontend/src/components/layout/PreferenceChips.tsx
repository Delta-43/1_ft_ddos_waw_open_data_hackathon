import { useEffect, useId, useRef, useState } from 'react';
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
 * A preferences icon in the nav bar. It opens a small panel with what the backend understood,
 * as toggles; each change re-sends the same prompt with explicit preferences.
 */
export function PreferenceChips({ understood, busy, onChange }: PreferenceChipsProps) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const root = useRef<HTMLDivElement>(null);

  // Close on Escape or a click outside.
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') setOpen(false); };
    const onClick = (event: MouseEvent) => { if (!root.current?.contains(event.target as Node)) setOpen(false); };
    window.addEventListener('keydown', onKey);
    window.addEventListener('mousedown', onClick);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('mousedown', onClick);
    };
  }, [open]);

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
    <div className="preferences-menu" ref={root}>
      <button
        type="button"
        className="preferences-menu__button"
        aria-label="Preferences"
        aria-expanded={open}
        aria-controls={panelId}
        title={`Preferences (understood by ${INTERPRETER_TEXT[understood.interpreted_by]})`}
        onClick={() => setOpen(value => !value)}
      >
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
          <path d="M4 7h10M18 7h2M4 17h4M12 17h8" />
          <circle cx="16" cy="7" r="2" />
          <circle cx="10" cy="17" r="2" />
        </svg>
      </button>
      <div id={panelId} className="preferences-menu__panel" hidden={!open} role="group" aria-label="Your preferences" aria-busy={busy}>
        <p className="preferences-menu__heading">Your preferences</p>
        <div className="preference-chips">
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
        </div>
      </div>
    </div>
  );
}
