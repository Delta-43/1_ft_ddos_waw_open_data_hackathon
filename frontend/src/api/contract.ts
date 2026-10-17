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

/** Refs #85 step 4. Gate a feature's UI on the matching flag here, not on a request
 * field merely being accepted - a flag is only true once that feature actually ships. */
export interface HealthResponse {
  status: 'ok';
  mode: 'fixture';
  contract_version: typeof CONTRACT_VERSION;
  capabilities: {
    /** POST /api/routes honours destination_place_id/via_place_ids (#85). */
    ordered_stops: boolean;
    /** GET /api/places?q= search (#84/#87). */
    place_search: boolean;
  };
}

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
   * The response visits it last; closed/unknown opening hours and an exceeded
   * max_duration_s are reported in the route's explanation rather than silently
   * dropped, but there's no no-feasible-route outcome or applied_itinerary field yet -
   * gate structured itinerary submission on the future
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
  /**
   * Refs #85 step 4. Null for a museum-outing response. Set when destination_place_id/
   * via_place_ids were honoured, so the UI can confirm what the backend actually used -
   * always exactly the request's own ids, never substituted.
   */
  applied_itinerary: { destination_place_id: string; via_place_ids: string[] } | null;
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
