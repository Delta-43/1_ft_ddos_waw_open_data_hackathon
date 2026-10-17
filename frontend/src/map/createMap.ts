import { AttributionControl, Map, NavigationControl, setWorkerUrl } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
// MapLibre v6 cannot locate its worker inside a bundle; `?worker&url` makes Vite emit
// a self-contained worker chunk (the dist worker imports a sibling shared file).
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url';
import { CAMERA_LIMITS, INITIAL_VIEW } from './config';
import { hideUnflaggedOutlines } from './buildingOutlines';
import { ResetViewControl } from './controls';
import { buildStyle, palette } from './style';

setWorkerUrl(workerUrl);

/**
 * Creates the 3D Warsaw map inside `container`. Framework-free: React (or anything
 * else) only needs to supply an element and call `map.remove()` on teardown.
 * Default handlers already cover mouse, trackpad and touch pan/zoom/rotate/tilt.
 */
export function createMap(container: HTMLElement, view: typeof INITIAL_VIEW = INITIAL_VIEW): Map {
  const map = new Map({
    container,
    style: buildStyle(palette),
    ...view,
    ...CAMERA_LIMITS,
    // Added below in non-compact form so tile/OSM credits are always visible.
    attributionControl: false,
    // 3× phone screens would shade 2.25× the pixels of 2× for little visible gain.
    pixelRatio: Math.min(window.devicePixelRatio || 1, 2),
    // No label fade: fading keeps redrawing the whole 3D scene after every move
    // (measured 6.8 → 1.3 frames per stop); labels and pins appear instantly instead.
    fadeDuration: 0,
  });

  map.addControl(new NavigationControl({ visualizePitch: true }), 'top-right');
  map.addControl(new ResetViewControl(), 'top-right');
  map.addControl(new AttributionControl({ compact: false }), 'bottom-right');
  // Show detailed building parts (Palace of Culture tiers, spires) instead of solid outlines.
  hideUnflaggedOutlines(map);
  return map;
}
