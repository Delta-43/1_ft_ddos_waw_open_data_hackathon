/** Categories with a dedicated hexagon icon. Unknown data should use 'generic'. */
export const PIN_CATEGORIES = ['landmark', 'museum', 'park', 'generic'] as const;
export type PinCategory = (typeof PIN_CATEGORIES)[number];

/** A point of interest drawn on the map. Coordinates are WGS84 degrees. */
export interface Pin {
  id: string;
  lat: number;
  lng: number;
  category: PinCategory;
  title: string;
  /** Extra fields shown in the popup. Keep values flat (no nested objects). */
  properties: Record<string, string | number | boolean>;
}
