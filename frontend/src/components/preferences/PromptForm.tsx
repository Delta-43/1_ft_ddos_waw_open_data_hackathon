import { useState } from 'react';

const MAX_LENGTH = 1000; // contracts/README.md: query is 1-1000 characters

type Props = {
  value: string;
  onChange: (value: string) => void;
  /** Called with the trimmed prompt once it is non-empty. */
  onSubmit: (prompt: string) => void;
  /** Compact = first prompt in the small panel; otherwise the input under the chat history. */
  compact: boolean;
  /** A search is running: the button spins faster and further sends wait. */
  busy?: boolean;
};

export function PromptForm({ value, onChange, onSubmit, compact, busy = false }: Props) {
  const [touched, setTouched] = useState(false);
  const trimmed = value.trim();
  const emptyError = touched && trimmed.length === 0;

  function submit() {
    setTouched(true);
    if (trimmed.length > 0 && !busy) {
      onSubmit(trimmed);
      // The box is cleared after sending; don't greet the next message with an "empty" error.
      setTouched(false);
    }
  }

  return (
    <form className="preferences-form" noValidate onSubmit={event => { event.preventDefault(); submit(); }}>
      <label htmlFor="outing-query" className={compact ? undefined : 'visually-hidden'}>What are we exploring today?</label>
      <textarea
        id="outing-query"
        rows={compact ? 3 : 2}
        maxLength={MAX_LENGTH}
        value={value}
        placeholder={compact ? undefined : 'Change your mind? Tell me more…'}
        aria-invalid={emptyError}
        aria-describedby="outing-hint"
        onChange={event => { onChange(event.target.value); setTouched(true); }}
        onKeyDown={event => {
          // Enter sends; Shift+Enter adds a new line. Ignore Enter while an IME is composing text.
          if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
            event.preventDefault();
            submit();
          }
        }}
      />
      <p id="outing-hint" className="hint">{value.length}/{MAX_LENGTH} characters</p>
      {emptyError && <p role="alert" className="error">Please describe your outing first.</p>}
      <button type="submit" className="gradient-ring-button" disabled={busy}>{busy ? 'Finding routes…' : 'Find routes'}</button>
    </form>
  );
}
