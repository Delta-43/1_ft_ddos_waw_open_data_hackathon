import type { Interpretation } from './interpretPreferences';

export type RequestStatus =
  | { state: 'idle' }
  | { state: 'loading' }
  | { state: 'error'; message: string }
  | { state: 'success' };

type Props = {
  interpretation: Interpretation;
  /** Names of preferences the user switched OFF. */
  off: Set<string>;
  status: RequestStatus;
  onToggle: (name: string) => void;
  onFindRoutes: () => void;
};

/** The separate preferences bar: what the assistant understood, with an on/off switch for each. */
export function PreferencesBar({ interpretation, off, status, onToggle, onFindRoutes }: Props) {
  const loading = status.state === 'loading';
  return (
    <section className="preferences-form" aria-label="Your preferences">
      <h2>Your preferences</h2>
      <ul className="summary">
        {interpretation.preferences.map(({ emoji, name }) => {
          const on = !off.has(name);
          return (
            <li key={name} className={on ? undefined : 'is-off'}>
              <span id={`pref-${name}`}><span aria-hidden="true">{emoji}</span> {name}</span>
              <button
                type="button"
                role="switch"
                aria-checked={on}
                aria-labelledby={`pref-${name}`}
                className="switch"
                disabled={loading}
                onClick={() => onToggle(name)}
              />
            </li>
          );
        })}
      </ul>
      <p className="hint">Mock preferences — fixed example, not yet interpreted by the AI agent.</p>
      <div className="actions">
        <button type="button" disabled={loading} onClick={onFindRoutes}>{loading ? 'Loading…' : 'Find routes'}</button>
      </div>
      <div aria-live="polite">
        {loading && <p className="hint">Looking for routes…</p>}
        {status.state === 'error' && <p role="alert" className="error">{status.message}</p>}
      </div>
    </section>
  );
}
