import type { LngLatBoundsLike, LngLatLike } from 'maplibre-gl';

/** Camera the map opens on and the "reset view" button returns to. */
export const INITIAL_VIEW = {
  // The Mermaid (Syrena) on the Vistula boulevards at Powiśle, looking east across the river.
  // OSM via Nominatim, 2026-10-18. GeoJSON order: [lng, lat].
  center: [21.03208, 52.24026] as LngLatLike,
  zoom: 15.4,
  pitch: 60,
  bearing: 60,
};

/** Camera limits: panning is restricted to the Warsaw metropolitan area. */
export const CAMERA_LIMITS = {
  maxBounds: [
    [20.6, 51.95],
    [21.5, 52.45],
  ] as LngLatBoundsLike,
  minZoom: 10,
  maxZoom: 19,
  maxPitch: 75,
};

/** OpenFreeMap: free OpenMapTiles-schema vector tiles, no API key. */
export const TILES = {
  tileJson: 'https://tiles.openfreemap.org/planet',
  glyphs: 'https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf',
  font: ['Noto Sans Regular'],
};
