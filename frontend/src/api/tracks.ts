/**
 * Typed client for POST /api/tracks/run (backend/app/main.py): one model decision call picks a
 * predefined, simulated track from the message, or `track_id` forces one; the shared planner then
 * routes it. The response is a normal routes response plus `track`.
 */
import type { RouteResponse } from './contract';

export interface TrackInfo {
  id: string;
  title: string;
  summary: string;
  travel_mode: 'walk' | 'bike';
  /** Always true: the tracks are predefined for the demo, not planned from scratch. */
  simulated: true;
  /** Who chose it: the user (by id), the model, or the keyword fallback. */
  picked_by: 'user' | 'model' | 'keywords';
  reason: string;
}

export type TrackResponse = RouteResponse & { track?: TrackInfo };

export async function runTrack(query: string, trackId?: string, signal?: AbortSignal): Promise<TrackResponse> {
  const response = await fetch('/api/tracks/run', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, ...(trackId && { track_id: trackId }) }),
    signal,
  });
  if (!response.ok) throw new Error(`Request failed: ${response.status}`);
  return response.json();
}
