import { useState } from 'react';
import { interpretPreferences, type Interpretation } from './interpretPreferences';

export type RequestStatus =
  | { state: 'idle' }
  | { state: 'loading' }
  | { state: 'error'; message: string }
  | { state: 'success' };

const MAX_LENGTH = 1000; // contracts/README.md: query is 1-1000 characters

type Props = {
  status: RequestStatus;
  onSubmit: (query: string) => void;
};

// Two steps: 1) the user writes a prompt, 2) we show a summary of their preferences
// and they confirm it to request routes.
export function PreferencesForm({ status, onSubmit }: Props) {
  const [query, setQuery] = useState('');
  const [touched, setTouched] = useState(false);
  const [interpretation, setInterpretation] = useState<Interpretation | null>(null);
  // Names of preferences the user has switched OFF (everything starts on).
  const [off, setOff] = useState<Set<string>>(new Set());
  const trimmed = query.trim();
  const loading = status.state === 'loading';
  const emptyError = touched && trimmed.length === 0;

  function interpret() {
    setTouched(true);
    if (trimmed.length === 0) return;
    setInterpretation(interpretPreferences(trimmed));
    setOff(new Set());
  }

  function toggle(name: string) {
    setOff(previous => {
      const next = new Set(previous);
      if (!next.delete(name)) next.add(name);
      return next;
    });
  }

  if (interpretation) {
    return (
      <section className="preferences-form" aria-label="Your preferences">
        <h2>Your preferences</h2>
        <blockquote className="prompt-echo">{trimmed}</blockquote>
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
                  onClick={() => toggle(name)}
                />
              </li>
            );
          })}
        </ul>
        <p className="hint">Mock preferences — fixed example, not yet interpreted by the AI agent.</p>
        <div className="actions">
          <button type="button" disabled={loading} onClick={() => setInterpretation(null)}>Edit prompt</button>
          <button type="button" disabled={loading} onClick={() => onSubmit(trimmed)}>{loading ? 'Loading…' : 'Find routes'}</button>
        </div>
        <div aria-live="polite">
          {loading && <p className="hint">Looking for routes…</p>}
          {status.state === 'error' && <p role="alert" className="error">{status.message}</p>}
        </div>
      </section>
    );
  }

  return (
    <form
      className="preferences-form"
      noValidate
      onSubmit={event => { event.preventDefault(); interpret(); }}
    >
      <label htmlFor="outing-query">What are we exploring today?</label>
      <textarea
        id="outing-query"
        rows={3}
        maxLength={MAX_LENGTH}
        value={query}
        aria-invalid={emptyError}
        aria-describedby="outing-hint"
        onChange={event => { setQuery(event.target.value); setTouched(true); }}
        onKeyDown={event => {
          // Enter sends; Shift+Enter adds a new line. Ignore Enter while an IME is composing text.
          if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
            event.preventDefault();
            interpret();
          }
        }}
      />
      <p id="outing-hint" className="hint">{query.length}/{MAX_LENGTH} characters</p>
      {emptyError && <p role="alert" className="error">Please describe your outing first.</p>}
      <button type="submit">Let's explore</button>
    </form>
  );
}
