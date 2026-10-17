/**
 * Typed client for POST /api/routes (contracts/README.md). Kept from the starter so
 * the preferences form (FE-02) can call it. Uses a relative URL; Vite proxies /api.
 */
import type { RouteResponse } from './contract';

export type { RouteResponse };

export async function requestRoutes(query: string, signal?: AbortSignal): Promise<RouteResponse> {
  const response = await fetch('/api/routes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query }),
    signal,
  });
  if (!response.ok) throw new Error(`Request failed: ${response.status}`);
  return response.json();
}
