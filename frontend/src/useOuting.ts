import { useRef, useState } from 'react';
import { MOCK_ROUTES_ENABLED, mockRoutes } from './api/mockRoutes';
import { requestRoutes } from './api/routes';
import { runTrack, type TrackResponse } from './api/tracks';

export type RequestStatus = { state: 'idle' } | { state: 'loading' } | { state: 'error'; message: string } | { state: 'success' };

function messageFor(error: unknown): string {
  const text = error instanceof Error ? error.message : '';
  if (text.endsWith('422')) return 'I couldn’t read that one. Try a few words about the mood or the place.';
  if (text.startsWith('Request failed')) return `The route service had a problem (${text.replace(/\D+/g, '')}). Try again in a moment.`;
  return 'I can’t reach the route service right now. Try again in a moment.';
}

/**
 * The outing conversation. A prompt goes to POST /api/tracks/run, which picks one predefined demo
 * track and routes it; a mood re-runs the same prompt with that mood's track. Falls back to
 * POST /api/routes if the backend has no tracks. Nothing is stored anywhere.
 */
export function useOuting() {
  const [status, setStatus] = useState<RequestStatus>({ state: 'idle' });
  const [result, setResult] = useState<TrackResponse | null>(null);
  const [query, setQuery] = useState('');
  /** The track the AI chose for the current prompt, so the UI can tell it from the user's own pick. */
  const [aiTrackId, setAiTrackId] = useState<string>();
  const inFlight = useRef<AbortController | null>(null);

  async function fetchFor(text: string, trackId: string | undefined, signal: AbortSignal): Promise<TrackResponse> {
    if (MOCK_ROUTES_ENABLED) return mockRoutes(signal);
    try {
      return await runTrack(text, trackId, signal);
    } catch (error) {
      // An older backend without tracks: plan from the prompt instead.
      if (error instanceof Error && error.message.endsWith('404')) return requestRoutes({ query: text }, signal);
      throw error;
    }
  }

  async function run(text: string, trackId?: string) {
    inFlight.current?.abort();
    const abort = new AbortController();
    inFlight.current = abort;
    setStatus({ state: 'loading' });
    try {
      const response = await fetchFor(text, trackId, abort.signal);
      if (abort.signal.aborted) return;
      setResult(response);
      if (!trackId) setAiTrackId(response.track?.id);
      setStatus({ state: 'success' });
    } catch (error) {
      if (abort.signal.aborted) return;
      setStatus({ state: 'error', message: messageFor(error) });
    }
  }

  return {
    status,
    result,
    query,
    aiTrackId,
    /** A new prompt: the AI picks the track. */
    ask(prompt: string) {
      setQuery(prompt);
      void run(prompt);
    },
    /** The same prompt with the mood (track) the user chose. */
    chooseTrack(trackId: string) {
      void run(query || 'A calm outing in Warsaw', trackId);
    },
    /** Back to the opening view. */
    reset() {
      inFlight.current?.abort();
      setResult(null);
      setQuery('');
      setAiTrackId(undefined);
      setStatus({ state: 'idle' });
    },
  };
}
