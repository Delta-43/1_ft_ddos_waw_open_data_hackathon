import { useState } from 'react';

export type RequestStatus =
  | { state: 'idle' }
  | { state: 'loading' }
  | { state: 'error'; message: string }
  | { state: 'success' };

const MAX_LENGTH = 1000; // contracts/README.md: query is 1-1000 characters

const EXAMPLES = [
  'A quiet, green museum outing',
  'A short walk past parks to a small museum',
];

type Props = {
  status: RequestStatus;
  onSubmit: (query: string) => void;
};

export function PreferencesForm({ status, onSubmit }: Props) {
  const [query, setQuery] = useState(EXAMPLES[0]);
  const [touched, setTouched] = useState(false);
  const trimmed = query.trim();
  const loading = status.state === 'loading';
  // Empty-state message: shown only after the user has interacted or tried to submit.
  const emptyError = touched && trimmed.length === 0;

  return (
    <form
      className="preferences-form"
      noValidate
      onSubmit={event => {
        event.preventDefault();
        setTouched(true);
        if (trimmed.length === 0 || loading) return;
        onSubmit(trimmed);
      }}
    >
      <label htmlFor="outing-query">Describe your outing</label>
      <textarea
        id="outing-query"
        rows={3}
        maxLength={MAX_LENGTH}
        value={query}
        aria-invalid={emptyError}
        aria-describedby="outing-hint"
        onChange={event => { setQuery(event.target.value); setTouched(true); }}
      />
      <p id="outing-hint" className="hint">{query.length}/{MAX_LENGTH} characters</p>
      {emptyError && <p role="alert" className="error">Please describe your outing before searching.</p>}

      <div className="examples">
        <span>Try:</span>
        {EXAMPLES.map(example => (
          <button type="button" key={example} disabled={loading} onClick={() => { setQuery(example); setTouched(true); }}>
            {example}
          </button>
        ))}
      </div>

      <button type="submit" disabled={loading}>{loading ? 'Loading…' : 'Find routes'}</button>

      <div aria-live="polite">
        {loading && <p className="hint">Looking for routes…</p>}
        {status.state === 'error' && <p role="alert" className="error">{status.message}</p>}
      </div>
    </form>
  );
}
