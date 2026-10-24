import { useEffect, useRef, useState } from 'react';
import { DEMO } from './demo/mode';
import { MOCK_ROUTES_ENABLED, mockRoutes } from './api/mockRoutes';
import { requestRoutes } from './api/routes';
import { runTrack, type TrackResponse } from './api/tracks';
import { isTransitExample, transitExample } from './api/transitExamples';
import { getLang } from './i18n/language';
import { translate } from './i18n/translations';
import { useLang } from './i18n/useT';

export type RequestStatus = { state: 'idle' } | { state: 'loading' } | { state: 'error'; message: string } | { state: 'success' };

function messageFor(error: unknown): string {
  const text = error instanceof Error ? error.message : '';
  const lang = getLang();
  if (text.endsWith('422')) return translate(lang, 'shellErrorRead');
  if (text.startsWith('Request failed')) return translate(lang, 'shellErrorService', { code: text.replace(/\D+/g, '') });
  return translate(lang, 'shellErrorReach');
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
  /** The last real outing, so a car-free example can head for the same destination. */
  const lastTrack = useRef<{ id?: string; end?: [number, number] }>({});
  /** Rebuilds the current answer when it was made in the browser (mock, car-free example); backend answers stay as sent. */
  const rebuild = useRef<(() => Promise<TrackResponse | null>) | null>(null);
  const lang = useLang();

  useEffect(() => {
    const again = rebuild.current;
    if (!again) return;
    void again().then(response => {
      if (response && rebuild.current === again) setResult(response);
    });
  }, [lang]);

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
    rebuild.current = null;
    setStatus({ state: 'loading' });
    try {
      const response = await fetchFor(text, trackId, abort.signal);
      if (abort.signal.aborted) return;
      setResult(response);
      if (MOCK_ROUTES_ENABLED) rebuild.current = () => mockRoutes();
      const coordinates = response.routes[0]?.geometry.coordinates;
      lastTrack.current = { id: response.track?.id, end: coordinates?.[coordinates.length - 1] };
      // The static demo has no model, so nothing there is an AI suggestion.
      if (!trackId && !DEMO) setAiTrackId(response.track?.id);
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
    /** The same prompt with the mood (track) the user chose; the transit mood loads a car-free example. */
    chooseTrack(trackId: string) {
      if (!isTransitExample(trackId)) {
        void run(query || 'A calm outing in Warsaw', trackId);
        return;
      }
      inFlight.current?.abort();
      rebuild.current = null;
      setStatus({ state: 'loading' });
      const { id, end } = lastTrack.current;
      const again = () => transitExample(id, end);
      void again().then(example => {
        if (example) {
          rebuild.current = again;
          setResult(example);
          setStatus({ state: 'success' });
        } else setStatus({ state: 'error', message: translate(getLang(), 'shellErrorReach') });
      });
    },
    /** Back to the opening view. */
    reset() {
      inFlight.current?.abort();
      rebuild.current = null;
      setResult(null);
      setQuery('');
      setAiTrackId(undefined);
      setStatus({ state: 'idle' });
    },
  };
}
