import { useState } from 'react';
import { Hint, Textarea } from '@heathmont/moon-core-tw';

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
    <form className="grid gap-2" noValidate onSubmit={event => { event.preventDefault(); submit(); }}>
      <label id="outing-query-label" htmlFor="outing-query" className={compact ? 'me-8 text-moon-16 font-medium' : 'visually-hidden'}>What are we exploring today?</label>
      <Textarea
        id="outing-query"
        rows={compact ? 3 : 2}
        maxLength={MAX_LENGTH}
        value={value}
        placeholder={compact ? undefined : 'Change your mind? Tell me more…'}
        error={emptyError}
        aria-invalid={emptyError}
        // Moon's Textarea falls back to aria-label="Textarea" without a placeholder, hiding the <label>.
        aria-labelledby="outing-query-label"
        aria-describedby="outing-hint"
        // Moon's textarea is fixed-size; let people drag it taller.
        className="resize-y p-3 text-moon-14"
        onChange={event => { onChange(event.target.value); setTouched(true); }}
        onKeyDown={event => {
          // Enter sends; Shift+Enter adds a new line. Ignore Enter while an IME is composing text.
          if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
            event.preventDefault();
            submit();
          }
        }}
      />
      {/* Not Moon's Hint: it has role="alert", which would announce the count on every keystroke. */}
      <p id="outing-hint" className="text-moon-12 text-trunks">{value.length}/{MAX_LENGTH} characters</p>
      {emptyError && <Hint error className="mt-0">Please describe your outing first.</Hint>}
      {/* The page's one animated accent (layout.css), in Moon's piccolo/hit colours. */}
      <button type="submit" className="gradient-ring-button text-moon-14" disabled={busy}>{busy ? 'Finding routes…' : 'Find routes'}</button>
    </form>
  );
}
