import { useEffect, useState } from 'react';
import { IconButton } from '@heathmont/moon-core-tw';
import type { ChatMessage, RequestStatus } from '../../useOuting';
import { PromptForm } from './PromptForm';

interface AssistantWidgetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  messages: ChatMessage[];
  status: RequestStatus;
  onAsk: (prompt: string) => void;
}

/**
 * The outing assistant: a chat only. What it understood appears as chips in the top bar,
 * and the routes appear in the page panels, so nothing here overlaps them.
 */
export function AssistantWidget({ open, onOpenChange, messages, status, onAsk }: AssistantWidgetProps) {
  const [query, setQuery] = useState('');
  const started = messages.length > 0;

  // Escape closes the panel.
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') onOpenChange(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onOpenChange]);

  function ask(prompt: string) {
    onAsk(prompt);
    setQuery('');
  }

  // Layout (position, column width, height) comes from layout.css via the assistant* class names.
  return (
    <div className="assistant fixed right-4 bottom-[calc(1rem+env(safe-area-inset-bottom))] z-10 flex flex-col items-end gap-3 max-w-[calc(100%-2rem)]">
      {/* Always mounted, only hidden, so the conversation survives closing the panel. */}
      <section className="assistant__panel moon-panel relative p-4 overflow-y-auto [&[hidden]]:hidden" aria-label="Outing assistant" hidden={!open}>
        <IconButton
          variant="ghost"
          size="xs"
          className="absolute top-2 end-2 z-1"
          aria-label="Close assistant"
          icon={<CloseIcon />}
          onClick={() => onOpenChange(false)}
        />
        {started && (
          <ol className="chat-history flex flex-col gap-2 overflow-y-auto min-h-12 pe-8" aria-label="Conversation" aria-live="polite">
            {messages.map((message, index) => (
              <li
                key={index}
                className={`max-w-[85%] px-3 py-2 rounded-moon-s-md text-moon-14 break-words ${message.role === 'user'
                  ? 'self-end bg-piccolo text-goten'
                  : 'self-start bg-gohan text-bulma'}`}
              >
                {message.text}
              </li>
            ))}
            {status.state === 'loading' && (
              <li className="chat-message--pending self-start max-w-[85%] px-3 py-2 rounded-moon-s-md bg-gohan text-moon-14 text-trunks italic">Looking for routes…</li>
            )}
          </ol>
        )}
        <PromptForm compact={!started} value={query} onChange={setQuery} onSubmit={ask} busy={status.state === 'loading'} />
      </section>
      <div className="flex items-center gap-3">
        {!open && !started && (
          // Speech bubble; its tail points at the guy on the right.
          <button
            type="button"
            className="moon-panel relative px-4 py-2 text-moon-14 transition-shadow hover:shadow-interactive focus-visible:shadow-interactive focus-visible:outline-none after:absolute after:top-1/2 after:-end-1.5 after:size-3 after:-translate-y-1/2 after:rotate-45 after:bg-goku after:content-['']"
            onClick={() => onOpenChange(true)}
          >
            What's up for today?
          </button>
        )}
        <IconButton
          variant="outline"
          size="xl"
          className="size-14 rounded-full bg-goku text-bulma shadow-moon-lg"
          aria-label={open ? 'Close assistant' : 'Open assistant'}
          aria-expanded={open}
          icon={<GuyIcon />}
          onClick={() => onOpenChange(!open)}
        />
      </div>
    </div>
  );
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true">
      <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function GuyIcon() {
  return (
    <svg viewBox="0 0 48 56" width="34" height="40" aria-hidden="true">
      <line x1="24" y1="4" x2="24" y2="11" stroke="currentColor" strokeWidth="2" />
      <circle cx="24" cy="4" r="3" fill="currentColor" />
      <rect x="8" y="11" width="32" height="26" rx="8" fill="none" stroke="currentColor" strokeWidth="2.5" />
      <circle cx="18" cy="23" r="3" fill="currentColor" />
      <circle cx="30" cy="23" r="3" fill="currentColor" />
      <path d="M18 31 Q24 35 30 31" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <rect x="14" y="40" width="20" height="12" rx="4" fill="none" stroke="currentColor" strokeWidth="2.5" />
    </svg>
  );
}
