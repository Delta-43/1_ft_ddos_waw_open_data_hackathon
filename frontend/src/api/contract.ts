/**
 * Types for API contract 1.0 (contracts/api.schema.json). Keep in sync with the schema;
 * change both in the same PR, approved by Delta and Alban.
 * Coordinates are [longitude, latitude]; distances in metres; durations in seconds.
 */
export const CONTRACT_VERSION = '1.0';

export type ResponseMode = 'mock' | 'live' | 'cached';
/** Per-input provenance; show it on cards and route explanations (DATA-08). */
export type SourceMode = 'real' | 'historical' | 'proxy' | 'simulated';
export type TravelMode = 'walk' | 'bike';
/** Matches the map pin icons. */
export type PlaceCategory = 'museum' | 'landmark' | 'park' | 'generic';

export interface Point {
  longitude: number;
  latitude: number;
}

export interface Priorities {
  /** 0 = ignore, 1 = most important. */
  quiet?: number;
  green?: number;
}

/** Holds no user identifiers; the backend rejects unknown fields and stores nothing. */
export interface Preferences {
  interests?: string[];
  travel_mode?: TravelMode;
  /** 900 to 28800 seconds. */
  max_duration_s?: number;
  priorities?: Priorities;
  start?: Point;
}

export interface RouteRequest {
  /** 1 to 1000 characters. */
  query: string;
  preferences?: Preferences;
  /**
   * Refs #85. Resolved against the catalogue (GET /api/places); unknown ids get a 422.
   * The response visits it last, but opening hours and max_duration_s aren't enforced
   * against it yet - gate structured itinerary submission on the future
   * HealthResponse.capabilities.ordered_stops, not on this field existing.
   */
  destination_place_id?: string;
  /** Refs #85. 0-5 ordered, unique stop ids visited before destination_place_id. */
  via_place_ids?: string[];
  /** Refs #85. 0-500 characters; may only influence preference reading, never facts. Not stored. */
  comment?: string;
}

export interface Source {
  id: string;
  name: string;
  mode: SourceMode;
  /** Credit line the UI must show. */
  attribution: string;
  url?: string | null;
  retrieved_at?: string | null;
  data_date?: string | null;
  method?: string | null;
}

/** value is null when unknown; show "unknown", never a guess. */
export interface Metric {
  value: number | null;
  source_id: string;
}

export interface Place {
  id: string;
  name: string;
  longitude: number;
  latitude: number;
  category: PlaceCategory;
  summary?: string | null;
  /** Raw OSM opening_hours text; null means unknown. */
  opening_hours: string | null;
  address?: string | null;
  website?: string | null;
  source_id: string;
}

export interface Stop {
  order: number;
  place_id: string;
  arrival_offset_s?: number | null;
  visit_duration_s?: number | null;
}

export interface LineString {
  type: 'LineString';
  coordinates: [number, number][];
}

export interface Route {
  id: string;
  name: string;
  /** 1 = best match. */
  rank: number;
  /** Exactly one route per response is recommended. */
  recommended: boolean;
  travel_mode: TravelMode;
  explanation: string;
  geometry: LineString;
  /** straight_line must be labelled as illustrative in the UI. */
  geometry_kind: 'street' | 'straight_line';
  geometry_source_id?: string;
  metrics: {
    distance_m: Metric;
    duration_s: Metric;
    /** 0 to 1, higher is greener. */
    green_score: Metric;
    /** 0 to 1, higher is quieter. */
    quiet_score: Metric;
  };
  stops: Stop[];
  places: Place[];
}

export interface InterpretedPreferences {
  interests: string[];
  travel_mode: TravelMode;
  max_duration_s: number | null;
  priorities: { quiet: number; green: number };
  interpreted_by: 'fixture' | 'rules' | 'model';
}

export interface RouteResponse {
  contract_version: typeof CONTRACT_VERSION;
  mode: ResponseMode;
  /** Always show as a banner. */
  notice: string;
  generated_at: string;
  preferences: InterpretedPreferences;
  /** 1 to 3 candidates. */
  routes: Route[];
  sources: Source[];
}

export interface PlacesResponse {
  contract_version: typeof CONTRACT_VERSION;
  mode: ResponseMode;
  notice: string;
  generated_at: string;
  /** At most 100. */
  places: Place[];
  sources: Source[];
}

/** Looks up a source by id, e.g. to label a metric or place. */
export function sourceFor(sources: Source[], id: string): Source | undefined {
  return sources.find(source => source.id === id);
}
