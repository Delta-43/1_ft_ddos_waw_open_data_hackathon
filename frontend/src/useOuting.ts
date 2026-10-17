import { useRef, useState } from 'react';
import type { Preferences, RouteResponse } from './api/contract';
import { requestRoutes } from './api/routes';

export type ChatMessage = { role: 'user' | 'assistant'; text: string };
export type RequestStatus = { state: 'idle' } | { state: 'loading' } | { state: 'error'; message: string } | { state: 'success' };

function messageFor(error: unknown): string {
  const text = error instanceof Error ? error.message : '';
  if (text.endsWith('422')) return 'That request was not valid. Describe your outing in 1–1000 characters.';
  if (text.startsWith('Request failed')) return `The server returned an error (${text.replace(/\D+/g, '')}). Please try again.`;
  return 'Could not reach the route service. Try again.';
}

/** Reply grounded only in the response: names, counts and the backend's own explanation. */
function replyFor(response: RouteResponse): string {
  const best = response.routes.find(route => route.recommended) ?? response.routes[0];
  if (!best) return 'No routes match. Try a longer time or fewer stops.';
  const count = response.routes.length;
  return `I found ${count} ${count === 1 ? 'route' : 'routes'}. Recommended: ${best.name}. ${best.explanation}`;
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
      const response = await requestRoutes({ query, ...(preferences && { preferences }) }, abort.signal);
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
