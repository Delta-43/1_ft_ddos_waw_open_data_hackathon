import type { Pin, PinCategory } from '../markers/types';
import { getJson, modeBadge, shortTime, sourceRows, WARSAW_BBOX, type ApiSource } from './api';
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

const text = (value: unknown) => (typeof value === 'string' && value.trim() ? value.trim() : undefined);

/** Popup rows per layer, from the layer-specific feature properties. */
const ROWS: Record<string, (p: Props) => Record<string, string | undefined>> = {
  air_quality: p => {
    const measurements = Array.isArray(p.measurements) ? (p.measurements as Measurement[]) : [];
    const main = measurements.filter(m => ['PM2.5', 'PM10', 'NO2', 'O3'].includes(m.param));
    return {
      'Air quality index': text(p.overall_index),
      Readings: main.map(m => `${m.param} ${m.value} ${m.unit}`).join(' · ') || undefined,
      Measured: measurements[0]?.time ? shortTime(measurements[0].time) : undefined,
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
