import { useEffect, useState } from 'react';
import type { Route, Source } from '../../api/contract';
import type { ChatMessage, RequestStatus } from '../../useOuting';
import { PromptForm } from './PromptForm';
import { RouteComparison } from '../results/RouteComparison';
import './preferences.css';

interface AssistantWidgetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  messages: ChatMessage[];
  status: RequestStatus;
  onAsk: (prompt: string) => void;
  /** Candidate routes of the current response; listed in the chat under the assistant's reply (#114). */
  routes?: Route[];
  sources?: Source[];
  notice?: string;
  explainedByModel?: boolean;
  selectedRouteId?: string;
  onSelectRoute: (id: string) => void;
}

/**
 * The outing assistant: a rounded chat that opens to the left of the bot button, with the suggested
 * routes listed in the chat, then the prompt bar. What it understood is in the Preferences panel.
 */
export function AssistantWidget({ open, onOpenChange, messages, status, onAsk, routes, sources, notice, explainedByModel = false, selectedRouteId, onSelectRoute }: AssistantWidgetProps) {
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

  return (
    <div className="assistant">
      {/* Always mounted, only hidden, so the conversation survives closing the panel. */}
      <section className="assistant__panel" aria-label="Outing assistant" hidden={!open}>
        <button type="button" className="assistant__close" aria-label="Close assistant" onClick={() => onOpenChange(false)}>×</button>
        {started && (
          <ol className="chat-history" aria-label="Conversation" aria-live="polite">
            {messages.map((message, index) => (
              <li key={index} className={`chat-message chat-message--${message.role}`}>{message.text}</li>
            ))}
            {status.state === 'loading' && <li className="chat-message chat-message--assistant chat-message--pending">Looking for routes…</li>}
          </ol>
        )}
        {routes && routes.length > 0 && (
          <RouteComparison
            routes={routes}
            sources={sources ?? []}
            selectedId={selectedRouteId}
            onSelect={onSelectRoute}
            explainedByModel={explainedByModel}
            notice={notice}
          />
        )}
        <PromptForm compact={!started} value={query} onChange={setQuery} onSubmit={ask} busy={status.state === 'loading'} />
      </section>
      <div className="assistant__row">
        {!open && !started && (
          <button type="button" className="assistant__bubble" onClick={() => onOpenChange(true)}>
            What's up for today?
          </button>
        )}
        <button
          type="button"
          className="assistant__guy"
          aria-label={open ? 'Close assistant' : 'Open assistant'}
          aria-expanded={open}
          onClick={() => onOpenChange(!open)}
        >
          <svg viewBox="0 0 48 56" width="40" height="46" aria-hidden="true">
            <line x1="24" y1="4" x2="24" y2="11" stroke="currentColor" strokeWidth="2" />
            <circle cx="24" cy="4" r="3" fill="currentColor" />
            <rect x="8" y="11" width="32" height="26" rx="8" fill="none" stroke="currentColor" strokeWidth="2.5" />
            <circle cx="18" cy="23" r="3" fill="currentColor" />
            <circle cx="30" cy="23" r="3" fill="currentColor" />
            <path d="M18 31 Q24 35 30 31" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <rect x="14" y="40" width="20" height="12" rx="4" fill="none" stroke="currentColor" strokeWidth="2.5" />
          </svg>
        </button>
      </div>
    </div>
  );
}
