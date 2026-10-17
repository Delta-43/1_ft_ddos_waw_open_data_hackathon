/**
 * Typed client for POST /api/routes (contracts/README.md). Uses a relative URL; Vite proxies /api.
 */
import type { RouteRequest, RouteResponse } from './contract';

export type { RouteResponse };

export async function requestRoutes(request: RouteRequest | string, signal?: AbortSignal): Promise<RouteResponse> {
  const body: RouteRequest = typeof request === 'string' ? { query: request } : request;
  const response = await fetch('/api/routes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal,
  });
  if (!response.ok) throw new Error(`Request failed: ${response.status}`);
  return response.json();
}
