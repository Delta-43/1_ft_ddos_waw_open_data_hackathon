import { CAMERA_LIMITS } from '../map/config';

/** Source metadata as returned in the API's `sources[]` (contracts/README.md). */
export interface ApiSource {
  id: string;
  name: string;
  mode: string;
  attribution: string;
  retrieved_at?: string | null;
  method?: string | null;
}

/** The whole map area (Warsaw metro bounds) as the API's `bbox` parameter. */
const [[minLon, minLat], [maxLon, maxLat]] = CAMERA_LIMITS.maxBounds as [[number, number], [number, number]];
export const WARSAW_BBOX = [minLon, minLat, maxLon, maxLat].join(',');

/** GET a relative `/api/...` URL (Vite proxies it to the backend); non-2xx throws. */
export async function getJson<T>(path: string, signal?: AbortSignal): Promise<T> {
  const response = await fetch(path, { signal });
  if (!response.ok) throw new Error(`${path}: HTTP ${response.status}`);
  return response.json() as Promise<T>;
}

const MODE_LABEL: Record<string, string> = {
  real: 'Real data, fetched at event time',
  cached: 'Cached open data',
  mock: 'Mock data',
  simulated: 'Simulated data',
};

/** Data-mode badge for a pin, e.g. "Cached open data · sample subset". */
export function modeBadge(source: ApiSource | undefined): string {
  if (!source) return 'Unknown source';
  const label = MODE_LABEL[source.mode] ?? `${source.mode} data`;
  return /sample/i.test(source.method ?? '') ? `${label} · sample subset` : label;
}

/** Popup rows naming the source and when it was retrieved. */
export function sourceRows(source: ApiSource | undefined): Record<string, string> {
  if (!source) return {};
  const rows: Record<string, string> = { Source: source.name };
  if (source.retrieved_at) rows.Retrieved = source.retrieved_at.slice(0, 16).replace('T', ' ');
  return rows;
}

/** "2027-01-29T19:00:00+01" → "2027-01-29 19:00" (the API's offsets are not always ISO). */
export const shortTime = (value: string) => value.slice(0, 16).replace('T', ' ');
