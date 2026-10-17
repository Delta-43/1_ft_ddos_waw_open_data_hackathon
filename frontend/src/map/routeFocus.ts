import type { ExpressionSpecification, Map } from 'maplibre-gl';
import type { Route } from '../api/contract';
import { BUILDING_MINZOOM, BUILDING_SOURCE } from './style';

/**
 * Route focus (Delta's mockup idea): while a route is selected, only buildings within
 * CORRIDOR_M of it stay 3D; the rest sink to flat footprints so the route holds attention.
 * Buildings are marked with feature-state in short slices when the map is idle, like
 * buildingOutlines.ts, so panning never stalls.
 */
const CORRIDOR_M = 220;
const NEAR_STATE = 'nearRoute';
const SLICE_MS = 6;
const LAYER_PROPERTIES = [
  ['building-3d', 'fill-extrusion-height'],
  ['building-3d', 'fill-extrusion-base'],
  ['building-roof', 'fill-extrusion-height'],
  ['building-roof', 'fill-extrusion-base'],
] as const;

type Segment = [number, number, number, number];
interface FocusState {
  originals: globalThis.Map<string, ExpressionSpecification | number>;
  segments: Segment[] | null;
  near: Set<string | number>;
  checked: Set<string | number>;
  dirty: boolean;
  scanning: boolean;
  timer?: ReturnType<typeof setTimeout>;
}
const states = new WeakMap<Map, FocusState>();

// Local metres around Warsaw (equirectangular is accurate enough for a few kilometres).
const M_PER_DEG_LAT = 110_540;
const M_PER_DEG_LNG = 111_320 * Math.cos((52.23 * Math.PI) / 180);
const toMetres = ([lng, lat]: number[]): [number, number] => [lng * M_PER_DEG_LNG, lat * M_PER_DEG_LAT];

function segmentsOf(route: Route): Segment[] {
  const points = route.geometry.coordinates.map(toMetres);
  return points.slice(1).map((point, i) => [points[i][0], points[i][1], point[0], point[1]]);
}

function distanceToSegments([x, y]: [number, number], segments: Segment[]): number {
  let best = Infinity;
  for (const [ax, ay, bx, by] of segments) {
    const dx = bx - ax;
    const dy = by - ay;
    const length = dx * dx + dy * dy;
    const t = length === 0 ? 0 : Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / length));
    best = Math.min(best, Math.hypot(x - (ax + t * dx), y - (ay + t * dy)));
  }
  return best;
}

/** First vertex of a (multi)polygon: cheap and within a building's width of its centre. */
function anchorOf(geometry: { coordinates?: unknown }): number[] | null {
  let value: unknown = geometry.coordinates;
  while (Array.isArray(value) && Array.isArray(value[0])) value = value[0];
  return Array.isArray(value) && typeof value[0] === 'number' ? (value as number[]) : null;
}

/** Height expressions: grow with zoom (the intro), and with focus only near buildings keep height. */
function applyHeights(map: Map, state: FocusState, focus: boolean): void {
  const near: ExpressionSpecification = ['boolean', ['feature-state', NEAR_STATE], false];
  for (const [layer, property] of LAYER_PROPERTIES) {
    const original = state.originals.get(`${layer}|${property}`);
    if (original === undefined || !map.getLayer(layer)) continue;
    // Intro: rise between zoom 13.5 and 14.8. Focus: buildings along the route are full height from 14.
    const value = focus ? (['case', near, original, 0] as ExpressionSpecification) : original;
    const [from, to] = focus ? [13.2, 14] : [13.5, 14.8];
    map.setPaintProperty(layer, property, ['interpolate', ['linear'], ['zoom'], from, 0, to, value]);
  }
}

function setNear(map: Map, id: string | number, value: boolean): void {
  map.setFeatureState({ source: BUILDING_SOURCE, sourceLayer: 'building', id }, { [NEAR_STATE]: value });
}

function scan(map: Map, state: FocusState): void {
  clearTimeout(state.timer);
  if (!state.segments || !state.dirty || map.getZoom() < BUILDING_MINZOOM || !map.getSource(BUILDING_SOURCE)) return;
  state.dirty = false;
  state.scanning = true;
  const segments = state.segments;
  const features = map.querySourceFeatures(BUILDING_SOURCE, { sourceLayer: 'building' });
  let index = 0;
  const slice = () => {
    if (state.segments !== segments) return; // the route changed; a new scan follows
    const deadline = performance.now() + SLICE_MS;
    while (index < features.length && performance.now() < deadline) {
      const feature = features[index++];
      const id = feature.id;
      if (id === undefined || state.checked.has(id)) continue;
      state.checked.add(id);
      const anchor = anchorOf(feature.geometry as { coordinates?: unknown });
      if (anchor && distanceToSegments(toMetres(anchor), segments) <= CORRIDOR_M) {
        state.near.add(id);
        setNear(map, id, true);
      }
    }
    if (index < features.length) state.timer = setTimeout(slice, 0);
    else state.scanning = false;
  };
  slice();
}

/** Call once after the style loads (it takes over the building heights from the intro). */
export function initRouteFocus(map: Map): void {
  const originals = new globalThis.Map<string, ExpressionSpecification | number>();
  for (const [layer, property] of LAYER_PROPERTIES) {
    if (!map.getLayer(layer)) continue;
    const value = map.getPaintProperty(layer, property) as ExpressionSpecification | number | undefined;
    if (value !== undefined) originals.set(`${layer}|${property}`, value);
  }
  const state: FocusState = { originals, segments: null, near: new Set(), checked: new Set(), dirty: false, scanning: false };
  states.set(map, state);
  if (import.meta.env.DEV) Object.assign(window, { routeFocusState: state });
  applyHeights(map, state, false);
  // Scan when the map settles: at 'idle', and also shortly after moves and tile loads, so a
  // brief route animation (which delays 'idle') never leaves new buildings unchecked.
  let soon: ReturnType<typeof setTimeout> | undefined;
  const scanSoon = () => {
    clearTimeout(soon);
    soon = setTimeout(() => { if (!map.isMoving()) scan(map, state); }, 250);
  };
  map.on('sourcedata', event => {
    if (event.sourceId !== BUILDING_SOURCE || !('tile' in event) || !event.tile) return;
    state.dirty = true;
    scanSoon();
  });
  map.on('moveend', scanSoon);
  // A move interrupts a running scan; finish it at the next idle (checked buildings are kept).
  map.on('movestart', () => {
    if (!state.scanning) return;
    clearTimeout(state.timer);
    state.scanning = false;
    state.dirty = true;
  });
  map.on('idle', () => scan(map, state));
}

/** Focus the map on `route` (or show every building again when it is undefined). */
export function focusRoute(map: Map, route: Route | undefined): void {
  const state = states.get(map);
  if (!state) return;
  for (const id of state.near) setNear(map, id, false);
  state.near.clear();
  state.checked.clear();
  state.segments = route ? segmentsOf(route) : null;
  state.dirty = true;
  state.scanning = false;
  clearTimeout(state.timer);
  applyHeights(map, state, route !== undefined);
  scan(map, state);
}
