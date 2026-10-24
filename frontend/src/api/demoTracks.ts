/**
 * The static demo's stand-in for POST /api/tracks/run: the same choice the backend makes without a
 * model (keyword match, then the first track), answered from the bundled snapshot of each track's
 * contract-1.0 response (public/demo/tracks/, made by scripts/build_demo_fixtures.py).
 */
import { asset } from '../demo/mode';
import type { TrackResponse } from './tracks';

interface TrackIndexEntry {
  id: string;
  title: string;
  keywords: string[];
}

let index: Promise<TrackIndexEntry[]> | undefined;

const fetchJson = async <T>(path: string, signal?: AbortSignal): Promise<T> => {
  const response = await fetch(asset(path), { signal });
  if (!response.ok) throw new Error(`Request failed: ${response.status}`);
  return response.json() as Promise<T>;
};

/** Same scoring as backend/app/services/tracks.py by_keywords: most keyword hits, ties go to the earlier track. */
function byKeywords(query: string, tracks: TrackIndexEntry[]): TrackIndexEntry {
  const text = query.toLowerCase();
  let best = tracks[0];
  let bestScore = -1;
  for (const track of tracks) {
    const score = track.keywords.filter(keyword => text.includes(keyword)).length;
    if (score > bestScore) [best, bestScore] = [track, score];
  }
  return best;
}

export async function demoTrack(query: string, trackId: string | undefined, signal?: AbortSignal): Promise<TrackResponse> {
  const tracks = await (index ??= fetchJson<TrackIndexEntry[]>('demo/tracks-index.json'));
  const chosen = trackId ? tracks.find(track => track.id === trackId) : byKeywords(query, tracks);
  if (!chosen) throw new Error('Request failed: 422');
  const response = await fetchJson<TrackResponse>(`demo/tracks/${chosen.id}.json`, signal);
  if (!response.track) return response;
  return trackId
    ? response
    : { ...response, track: { ...response.track, picked_by: 'keywords', reason: 'Matched by keywords in the static demo; no model is used.' } };
}
