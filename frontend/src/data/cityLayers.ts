import type { Pin, PinCategory } from '../markers/types';
import { getJson, modeBadge, shortTime, sourceRows, WARSAW_BBOX, warsawTime, type ApiSource } from './api';
import type { PinProvider } from './types';

type Props = Record<string, unknown>;

interface LayerResponse {
  features: { geometry: { type: string; coordinates: [number, number] }; properties: Props }[];
  sources: ApiSource[];
}

interface Measurement {
  param: string;
  value: number;
  unit: string;
  time?: string;
}

/** The backend's verdict on one reading (`properties.freshness`, backend/app/services/freshness.py). */
interface Freshness {
  updated_at: string | null;
  fresh: boolean;
  reason: 'stale' | 'no_timestamp' | 'timestamp_in_future' | null;
}

const text = (value: unknown) => (typeof value === 'string' && value.trim() ? value.trim() : undefined);

/**
 * How current an air-quality reading is. The backend judges freshness (30-minute rule); the map
 * only words its verdict and never calls a reading live on its own. Without a verdict (older
 * backends) it states the time and makes no claim either way.
 */
function readingRow(freshness: Freshness | undefined, latest: string | undefined): string | undefined {
  if (!freshness) return latest ? `Last updated ${shortTime(latest)}` : undefined;
  const at = freshness.updated_at ? warsawTime(freshness.updated_at) : undefined;
  if (freshness.fresh && at) return `Live reading, updated ${at}`;
  if (at) return `Cached reading, last updated ${at}`;
  return 'Cached reading, update time unknown';
}

/** Popup rows per layer, from the layer-specific feature properties. */
const ROWS: Record<string, (p: Props) => Record<string, string | undefined>> = {
  air_quality: p => {
    const measurements = Array.isArray(p.measurements) ? (p.measurements as Measurement[]) : [];
    const main = measurements.filter(m => ['PM2.5', 'PM10', 'NO2', 'O3'].includes(m.param));
    // Latest measurement time, the same reading the backend's freshness verdict judges.
    const latest = measurements.map(m => m.time).filter((t): t is string => !!t).sort().at(-1);
    const freshness = p.freshness && typeof p.freshness === 'object' ? (p.freshness as Freshness) : undefined;
    return {
      Reading: readingRow(freshness, latest),
      'Air quality index': text(p.overall_index),
      Readings: main.map(m => `${m.param} ${m.value} ${m.unit}`).join(' · ') || undefined,
    };
  },
  aed: p => ({ Access: text(p.access), Hours: text(p.access_hours) }),
  toilets: p => ({ District: text(p.district), 'Opening hours': text(p.opening_hours) }),
  events: p => ({
    Category: Array.isArray(p.event_category) ? p.event_category.join(', ') : text(p.event_category),
    Starts: text(p.starts_at) && shortTime(p.starts_at as string),
    Ends: text(p.ends_at) && shortTime(p.ends_at as string),
  }),
};

/** A Warsaw open-data layer from `GET /api/layers/{layer}` (GeoJSON), drawn as pins. */
function layerProvider(layer: string, label: string, category: PinCategory): PinProvider {
  return {
    id: layer,
    label,
    async fetchPins(signal) {
      const data = await getJson<LayerResponse>(`/api/layers/${layer}?bbox=${WARSAW_BBOX}&limit=500`, signal);
      const sources = new Map(data.sources.map(source => [source.id, source]));
      return data.features
        .filter(feature => feature.geometry.type === 'Point')
        .map((feature, index): Pin => {
          const p = feature.properties;
          const source = sources.get(String(p.source_id));
          const rows = Object.entries(ROWS[layer]?.(p) ?? {}).filter((row): row is [string, string] => !!row[1]);
          const [lng, lat] = feature.geometry.coordinates;
          return {
            // Layer features carry no stable id (toilets' ids are synthetic), so key by position.
            id: `${layer}:${lng.toFixed(6)},${lat.toFixed(6)}:${index}`,
            lat,
            lng,
            category,
            title: text(p.name) ?? label,
            properties: { ...Object.fromEntries(rows), ...sourceRows(source) },
            badge: modeBadge(source),
            attribution: source?.attribution,
          };
        });
    },
  };
}

/** The city layers served by the backend (see `GET /api/layers`). */
export const cityLayerProviders: PinProvider[] = [
  layerProvider('air_quality', 'Air quality stations', 'air'),
  layerProvider('aed', 'Defibrillators (AED)', 'aed'),
  layerProvider('toilets', 'Public toilets', 'toilet'),
  layerProvider('events', 'Cultural events', 'event'),
];
