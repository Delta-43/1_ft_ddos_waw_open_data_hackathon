/**
 * Typed client for POST /api/routes (contracts/README.md). Kept from the starter so
 * the preferences form (FE-02) can call it. Uses a relative URL; Vite proxies /api.
 */
export interface RouteResponse {
  mode: 'mock' | 'live' | 'cached';
  notice: string;
  routes: {
    id: string;
    name: string;
    /** GeoJSON LineString; coordinates are [longitude, latitude]. */
    geometry: { type: 'LineString'; coordinates: [number, number][] };
    places: { id: string; name: string; longitude: number; latitude: number }[];
  }[];
}

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
