/**
 * Typed client for POST /api/tracks/run (backend/app/main.py): one model decision call picks a
 * predefined, simulated track from the message, or `track_id` forces one; the shared planner then
 * routes it. The response is a normal routes response plus `track`.
 */
import { DEMO } from '../demo/mode';
import { demoTrack } from './demoTracks';
import type { RouteResponse } from './contract';
import type { Leg } from './transitExamples';

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

/** A car-free example (transitExamples.ts) adds its legs and times. */
export type TrackResponse = RouteResponse & { track?: TrackInfo; legs?: Leg[]; depart?: string; arrive?: string };

export async function runTrack(query: string, trackId?: string, signal?: AbortSignal): Promise<TrackResponse> {
  if (DEMO) return demoTrack(query, trackId, signal);
  const response = await fetch('/api/tracks/run', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, ...(trackId && { track_id: trackId }) }),
    signal,
  });
  if (!response.ok) throw new Error(`Request failed: ${response.status}`);
  return response.json();
}
