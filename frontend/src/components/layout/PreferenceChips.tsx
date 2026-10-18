import { useEffect, useId, useRef, useState } from 'react';
import type { InterpretedPreferences, Preferences } from '../../api/contract';
import { useT } from '../../i18n/useT';
import type { Key } from '../../i18n/translations';
import './layout.css';

interface PreferenceChipsProps {
  understood: InterpretedPreferences;
  busy: boolean;
  onChange: (preferences: Preferences) => void;
}

const INTERPRETER_KEY: Record<InterpretedPreferences['interpreted_by'], Key> = {
  fixture: 'interpretedFixture',
  rules: 'interpretedRules',
  model: 'interpretedModel',
};

const ON = 0.8;

/**
 * A preferences icon in the nav bar. It opens a small panel with what the backend understood,
 * as toggles; each change re-sends the same prompt with explicit preferences.
 */
export function PreferenceChips({ understood, busy, onChange }: PreferenceChipsProps) {
  const t = useT();
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
        aria-label={t('preferencesAriaLabel')}
        aria-expanded={open}
        aria-controls={panelId}
        title={t('preferencesTitle', { by: t(INTERPRETER_KEY[understood.interpreted_by]) })}
        onClick={() => setOpen(value => !value)}
      >
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
          <path d="M4 7h10M18 7h2M4 17h4M12 17h8" />
          <circle cx="16" cy="7" r="2" />
          <circle cx="10" cy="17" r="2" />
        </svg>
      </button>
      <div id={panelId} className="preferences-menu__panel" hidden={!open} role="group" aria-label={t('yourPreferences')} aria-busy={busy}>
        <p className="preferences-menu__heading">{t('yourPreferences')}</p>
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
            title={t('switchWalkBike')}
          >
            {understood.travel_mode === 'walk' ? t('walk') : t('bike')}
          </button>
          <button type="button" className="preference-chip" aria-pressed={quiet} disabled={busy} onClick={() => toggle('quiet')}>
            {t('quiet')}
          </button>
          <button type="button" className="preference-chip" aria-pressed={green} disabled={busy} onClick={() => toggle('green')}>
            {t('green')}
          </button>
          <span className="preference-chip preference-chip--static">{hours != null ? t('hoursLimit', { hours }) : t('noTimeLimit')}</span>
        </div>
      </div>
    </div>
  );
}
