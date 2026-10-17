import type { ExpressionSpecification, Map } from 'maplibre-gl';
import type { Route } from '../api/contract';
import type { RouteColour } from './routeColours';
import { BUILDING_MINZOOM, BUILDING_SOURCE } from './style';

/**
 * Route focus, after Delta's mockup (mockups/warsaw-2076): while a route is selected, only the
 * buildings in a corridor around it stay 3D, tinted in the route's colour; every other building
 * sinks to a pale flat footprint and a veil mutes the rest of the map.
 * Buildings are marked with feature-state in short slices when the map settles, so panning
 * never stalls. (A `distance` layer filter is not used: MapLibre ignores it when drawing.)
 */
const CORRIDOR_M = 210; // the mockup's corridor width
const NEAR_STATE = 'nearRoute';
const SLICE_MS = 6;
const HEIGHT_PROPERTIES = [
  ['building-3d', 'fill-extrusion-height'],
  ['building-3d', 'fill-extrusion-base'],
  ['building-roof', 'fill-extrusion-height'],
  ['building-roof', 'fill-extrusion-base'],
] as const;
const COLOUR_LAYERS = ['building-3d', 'building-roof'] as const;
const FADED = '#e6e9e3'; // far buildings: close to the veil, so they fade into the ground
const VEIL_SOURCE = 'focus-veil'; // not 'route-…': historicalOverlay.ts inserts below the first 'route-' layer
const VEIL_LAYER = 'focus-veil';
const VEIL_OPACITY = 0.62;

type Paint = ExpressionSpecification | string | number;
type Segment = [number, number, number, number];
interface FocusState {
  originals: globalThis.Map<string, Paint>;
  key: string;
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

const isNear: ExpressionSpecification = ['boolean', ['feature-state', NEAR_STATE], false];

/** Heights grow with zoom (the intro); with a route, only buildings near it keep their height. */
function applyPaint(map: Map, state: FocusState, colour: RouteColour | undefined): void {
  for (const [layer, property] of HEIGHT_PROPERTIES) {
    const original = state.originals.get(`${layer}|${property}`);
    if (original === undefined || !map.getLayer(layer)) continue;
    const value = colour ? (['case', isNear, original, 0] as ExpressionSpecification) : original;
    const [from, to] = colour ? [13.2, 14] : [13.5, 14.8];
    map.setPaintProperty(layer, property, ['interpolate', ['linear'], ['zoom'], from, 0, to, value]);
  }
  for (const layer of COLOUR_LAYERS) {
    const original = state.originals.get(`${layer}|fill-extrusion-color`);
    if (original === undefined || !map.getLayer(layer)) continue;
    const tint = layer === 'building-roof' ? colour?.roof : colour?.tint;
    map.setPaintProperty(layer, 'fill-extrusion-color', (tint ? ['case', isNear, tint, FADED] : original) as ExpressionSpecification);
  }
  const outline = state.originals.get('building-outline|line-opacity');
  if (outline !== undefined && map.getLayer('building-outline')) {
    map.setPaintProperty('building-outline', 'line-opacity', (colour ? ['case', isNear, outline, 0] : outline) as ExpressionSpecification);
  }
  if (map.getLayer(VEIL_LAYER)) map.setPaintProperty(VEIL_LAYER, 'fill-opacity', colour ? VEIL_OPACITY : 0);
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

/** Call once after the style loads: it takes over the building heights and colours, and adds the veil. */
export function initRouteFocus(map: Map): void {
  const originals = new globalThis.Map<string, Paint>();
  const remember = (layer: string, property: Parameters<Map['getPaintProperty']>[1]) => {
    if (!map.getLayer(layer)) return;
    const value = map.getPaintProperty(layer, property) as Paint | undefined;
    if (value !== undefined) originals.set(`${layer}|${property}`, value);
  };
  for (const [layer, property] of HEIGHT_PROPERTIES) remember(layer, property);
  for (const layer of COLOUR_LAYERS) remember(layer, 'fill-extrusion-color');
  remember('building-outline', 'line-opacity');

  // A pale veil over the ground, roads and labels, drawn under the buildings and the route.
  map.addSource(VEIL_SOURCE, {
    type: 'geojson',
    data: { type: 'Feature', properties: {}, geometry: { type: 'Polygon', coordinates: [[[19, 51], [23, 51], [23, 53.5], [19, 53.5], [19, 51]]] } },
  });
  const firstBuilding = ['building-outline', 'building-3d'].find(layer => map.getLayer(layer));
  map.addLayer(
    { id: VEIL_LAYER, type: 'fill', source: VEIL_SOURCE, paint: { 'fill-color': '#f2f4ef', 'fill-opacity': 0, 'fill-opacity-transition': { duration: 600 } } },
    firstBuilding,
  );

  const state: FocusState = { originals, key: '', segments: null, near: new Set(), checked: new Set(), dirty: false, scanning: false };
  states.set(map, state);
  if (import.meta.env.DEV) Object.assign(window, { routeFocusState: state });
  applyPaint(map, state, undefined);
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

/** Focus the map on `route`, tinted in its colour (or show the whole city again when undefined). */
export function focusRoute(map: Map, route: Route | undefined, colour?: RouteColour): void {
  const state = states.get(map);
  if (!state) return;
  const key = route ? `${route.id}:${route.geometry.coordinates.length}:${colour?.line}` : '';
  if (state.key === key) return; // unchanged: keep the buildings already marked
  state.key = key;
  for (const id of state.near) setNear(map, id, false);
  state.near.clear();
  state.checked.clear();
  state.segments = route ? segmentsOf(route) : null;
  state.dirty = true;
  applyPaint(map, state, route ? colour : undefined);
  scan(map, state);
}
