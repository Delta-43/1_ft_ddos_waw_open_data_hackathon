/** Categories with a dedicated hexagon icon. Unknown data should use 'generic'. */
export const PIN_CATEGORIES = ['landmark', 'museum', 'park', 'generic', 'air', 'aed', 'toilet', 'event'] as const;
export type PinCategory = (typeof PIN_CATEGORIES)[number];

/** A point of interest drawn on the map. Coordinates are WGS84 degrees. */
export interface Pin {
  id: string;
  lat: number;
  lng: number;
  category: PinCategory;
  title: string;
  /** Extra fields shown in the popup, keyed by their display label. Keep values flat. */
  properties: Record<string, string | number | boolean>;
  /** Data-mode label shown as a badge in the popup, e.g. "Cached open data · sample subset". */
  badge?: string;
  /** Licence credit of the pin's source (plain text); shown in the map attribution. */
  attribution?: string;
}
