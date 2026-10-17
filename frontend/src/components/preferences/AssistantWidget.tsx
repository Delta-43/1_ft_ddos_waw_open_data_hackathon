import { useEffect, useState } from 'react';
import { requestRoutes, type RouteResponse } from '../../api/routes';
import { PlaceCardList } from '../places/PlaceCardList';
import { DataModeBadge } from '../provenance/DataModeBadge';
import { PreferencesForm, type RequestStatus } from './PreferencesForm';
import './preferences.css';

function messageFor(error: unknown): string {
  const text = error instanceof Error ? error.message : '';
  if (text.endsWith('422')) return 'The request was not valid. Check your description (1–1000 characters).';
  if (text.startsWith('Request failed')) return `The server returned an error (${text.replace(/\D+/g, '')}). Please try again.`;
  return 'Could not reach the server. Is the backend running?';
}

/** Little guy in the bottom-left corner. Clicking it opens the prompt → summary flow. */
export function AssistantWidget() {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<RequestStatus>({ state: 'idle' });
  const [result, setResult] = useState<RouteResponse | null>(null);

  // Escape closes the panel.
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  async function search(query: string) {
    setStatus({ state: 'loading' });
    try {
      setResult(await requestRoutes(query));
      setStatus({ state: 'success' });
    } catch (error) {
      setStatus({ state: 'error', message: messageFor(error) });
    }
  }

  const route = result?.routes[0];

  return (
    <div className="assistant">
      {/* Always mounted, only hidden, so the prompt and summary survive closing the panel. */}
      <section className="assistant__panel" aria-label="Outing assistant" hidden={!open}>
        <button type="button" className="assistant__close" aria-label="Close assistant" onClick={() => setOpen(false)}>×</button>
        <PreferencesForm status={status} onSubmit={search} />
        {result && route && (
          <div className="assistant__results">
            <p className="assistant__notice"><DataModeBadge mode={result.mode} /> {result.notice}</p>
            <PlaceCardList places={route.places} mode={result.mode} routeName={route.name} />
          </div>
        )}
      </section>
      <div className="assistant__row">
        {!open && (
          <button type="button" className="assistant__bubble" onClick={() => setOpen(true)}>
            What's up for today?
          </button>
        )}
        <button
          type="button"
          className="assistant__guy"
          aria-label={open ? 'Close assistant' : 'Open assistant'}
          aria-expanded={open}
          onClick={() => setOpen(value => !value)}
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
