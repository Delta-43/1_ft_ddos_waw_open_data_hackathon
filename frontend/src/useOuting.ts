import { useRef, useState } from 'react';
import type { Preferences, RouteResponse } from './api/contract';
import { MOCK_ROUTES_ENABLED, mockRoutes } from './api/mockRoutes';
import { requestRoutes } from './api/routes';
import { getLang } from './i18n/language';
import { translate } from './i18n/translations';

export type ChatMessage = { role: 'user' | 'assistant'; text: string };
export type RequestStatus = { state: 'idle' } | { state: 'loading' } | { state: 'error'; message: string } | { state: 'success' };

function messageFor(error: unknown): string {
  const text = error instanceof Error ? error.message : '';
  const lang = getLang();
  if (text.endsWith('422')) return translate(lang, 'errorInvalidRequest');
  if (text.startsWith('Request failed')) return translate(lang, 'errorServer', { code: text.replace(/\D+/g, '') });
  return translate(lang, 'errorUnreachable');
}

/** Short reply that introduces the route list; says so when nothing matched. */
function replyFor(response: RouteResponse): string {
  const lang = getLang();
  if (response.routes.length === 0) return translate(lang, 'noRoutesMatch');
  // The routes themselves are listed under the prompt bar (RouteSwitch).
  return translate(lang, response.routes.length === 1 ? 'recommendedRoute' : 'recommendedRoutes');
}

/**
 * The outing conversation: the prompt goes to POST /api/routes, and the backend's
 * understood preferences can then be adjusted and re-sent. Nothing is stored anywhere.
 */
export function useOuting() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [status, setStatus] = useState<RequestStatus>({ state: 'idle' });
  const [result, setResult] = useState<RouteResponse | null>(null);
  const lastQuery = useRef('');
  const inFlight = useRef<AbortController | null>(null);

  async function run(query: string, preferences?: Preferences, announce = true) {
    inFlight.current?.abort();
    const abort = new AbortController();
    inFlight.current = abort;
    lastQuery.current = query;
    setStatus({ state: 'loading' });
    try {
      const response = MOCK_ROUTES_ENABLED
        ? await mockRoutes(abort.signal)
        : await requestRoutes({ query, ...(preferences && { preferences }) }, abort.signal);
      if (abort.signal.aborted) return;
      setResult(response);
      setStatus({ state: 'success' });
      if (announce) setMessages(previous => [...previous, { role: 'assistant', text: replyFor(response) }]);
    } catch (error) {
      if (abort.signal.aborted) return;
      const message = messageFor(error);
      setStatus({ state: 'error', message });
      setMessages(previous => [...previous, { role: 'assistant', text: message }]);
    }
  }

  return {
    messages,
    status,
    result,
    /** A new prompt from the chat. */
    ask(prompt: string) {
      setMessages(previous => [...previous, { role: 'user', text: prompt }]);
      void run(prompt);
    },
    /** Re-run the last prompt with adjusted preferences (explicit preferences win over the prompt). */
    refine(preferences: Preferences) {
      if (lastQuery.current) void run(lastQuery.current, preferences, false);
    },
  };
}
