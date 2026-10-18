import { getLang } from '../i18n/language';
import { translate, type Key } from '../i18n/translations';
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

const MODE_KEY: Record<string, Key> = {
  real: 'pinModeReal',
  cached: 'pinModeCached',
  mock: 'pinModeMock',
  simulated: 'pinModeSimulated',
};

/** Data-mode badge for a pin, e.g. "Cached open data · sample subset". */
export function modeBadge(source: ApiSource | undefined): string {
  const lang = getLang();
  if (!source) return translate(lang, 'unknownSourceText');
  const label = MODE_KEY[source.mode] ? translate(lang, MODE_KEY[source.mode]) : translate(lang, 'pinModeOther', { mode: source.mode });
  return /sample/i.test(source.method ?? '') ? `${label}${translate(lang, 'pinModeSampleSuffix')}` : label;
}

/** Popup rows naming the source and when it was retrieved. */
export function sourceRows(source: ApiSource | undefined): Record<string, string> {
  if (!source) return {};
  const lang = getLang();
  const rows: Record<string, string> = { [translate(lang, 'rowSource')]: source.name };
  if (source.retrieved_at) rows[translate(lang, 'rowRetrieved')] = source.retrieved_at.slice(0, 16).replace('T', ' ');
  return rows;
}

/** "2027-01-29T19:00:00+01" → "2027-01-29 19:00" (the API's offsets are not always ISO). */
export const shortTime = (value: string) => value.slice(0, 16).replace('T', ' ');

const WARSAW_TZ = 'Europe/Warsaw';
const dayKey = (date: Date) => date.toLocaleDateString('en-CA', { timeZone: WARSAW_TZ });

/** An ISO time with offset as Warsaw local time: "13:00" today, "2026-10-16 13:00" otherwise. */
export function warsawTime(iso: string): string | undefined {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return undefined;
  const time = date.toLocaleTimeString('en-GB', { timeZone: WARSAW_TZ, hour: '2-digit', minute: '2-digit' });
  return dayKey(date) === dayKey(new Date()) ? time : `${dayKey(date)} ${time}`;
}
