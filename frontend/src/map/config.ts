import type { LngLatBoundsLike, LngLatLike } from 'maplibre-gl';
import { absoluteAsset, DEMO } from '../demo/mode';

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
  // The static demo bundles tiles for central Warsaw only (scripts/build_demo_tiles.py).
  maxBounds: (DEMO
    ? [
        [20.95, 52.18],
        [21.09, 52.28],
      ]
    : [
        [20.6, 51.95],
        [21.5, 52.45],
      ]) as LngLatBoundsLike,
  minZoom: 10,
  maxZoom: 19,
  maxPitch: 75,
};

/** OpenFreeMap: free OpenMapTiles-schema vector tiles, no API key. */
export const TILES = DEMO
  ? {
      // The static demo loads nothing from other hosts: a PMTiles extract and the label glyphs ship with the site.
      tileJson: `pmtiles://${absoluteAsset('demo/warsaw.pmtiles')}`,
      // Not through `new URL`, which would escape the {tokens}.
      glyphs: `${absoluteAsset('demo/fonts/')}{fontstack}/{range}.pbf`,
      font: ['Noto Sans Regular'],
    }
  : {
      tileJson: 'https://tiles.openfreemap.org/planet',
      glyphs: 'https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf',
      font: ['Noto Sans Regular'],
    };
