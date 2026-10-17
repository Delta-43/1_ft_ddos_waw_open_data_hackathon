import type { ExpressionSpecification, FilterSpecification, GeoJSONSource, Map } from 'maplibre-gl';
import type { Route } from '../api/contract';
import type { RouteColour } from './routeColours';

/**
 * Route focus, after Delta's mockup (mockups/warsaw-2076): while a route is selected, only the
 * buildings in a corridor around it stay, in 3D and tinted in the route's colour; every other
 * building is removed and the rest of the map is muted into a pale, flat overview.
 * MapLibre evaluates the `distance` expression per building polygon in the layer filters,
 * so nothing has to be scanned or tracked here.
 */
const CORRIDOR_M = 210; // the mockup's corridor width
const BUILDING_LAYERS = ['building-3d', 'building-roof', 'building-outline'] as const;
const HEIGHT_PROPERTIES = [
  ['building-3d', 'fill-extrusion-height'],
  ['building-3d', 'fill-extrusion-base'],
  ['building-roof', 'fill-extrusion-height'],
  ['building-roof', 'fill-extrusion-base'],
] as const;
const VEIL_SOURCE = 'route-focus-veil';
const VEIL_LAYER = 'route-focus-veil';
const VEIL_OPACITY = 0.62;

type Paint = ExpressionSpecification | string | undefined;
interface FocusState {
  filters: globalThis.Map<string, FilterSpecification | undefined>;
  colours: { walls: Paint; roof: Paint };
  key: string;
}
const states = new WeakMap<Map, FocusState>();

/** Call once after the style loads: buildings rise with zoom (the intro), and the veil is added. */
export function initRouteFocus(map: Map): void {
  for (const [layer, property] of HEIGHT_PROPERTIES) {
    if (!map.getLayer(layer)) continue;
    const value = map.getPaintProperty(layer, property) as ExpressionSpecification | number | undefined;
    if (value !== undefined) map.setPaintProperty(layer, property, ['interpolate', ['linear'], ['zoom'], 13.5, 0, 14.8, value]);
  }
  const filters = new globalThis.Map<string, FilterSpecification | undefined>();
  for (const layer of BUILDING_LAYERS) {
    if (map.getLayer(layer)) filters.set(layer, map.getFilter(layer) as FilterSpecification | undefined);
  }
  const colours = {
    walls: map.getLayer('building-3d') ? (map.getPaintProperty('building-3d', 'fill-extrusion-color') as Paint) : undefined,
    roof: map.getLayer('building-roof') ? (map.getPaintProperty('building-roof', 'fill-extrusion-color') as Paint) : undefined,
  };
  // A pale veil over the ground, roads and labels, drawn under the buildings and the route.
  map.addSource(VEIL_SOURCE, {
    type: 'geojson',
    data: { type: 'Feature', properties: {}, geometry: { type: 'Polygon', coordinates: [[[19, 51], [23, 51], [23, 53.5], [19, 53.5], [19, 51]]] } },
  });
  const firstBuilding = BUILDING_LAYERS.map(layer => (map.getLayer(layer) ? layer : undefined)).find(Boolean);
  map.addLayer(
    { id: VEIL_LAYER, type: 'fill', source: VEIL_SOURCE, paint: { 'fill-color': '#f2f4ef', 'fill-opacity': 0, 'fill-opacity-transition': { duration: 600 } } },
    firstBuilding === 'building-outline' ? 'building-outline' : 'building-3d',
  );
  states.set(map, { filters, colours, key: '' });
}

/** Show only the corridor around `route`, tinted in its colour (or the whole city again when undefined). */
export function focusRoute(map: Map, route: Route | undefined, colour?: RouteColour): void {
  const state = states.get(map);
  if (!state) return;
  const key = route ? `${route.id}:${route.geometry.coordinates.length}:${colour?.line}` : '';
  if (state.key === key) return; // unchanged: don't make MapLibre re-filter every tile
  state.key = key;

  const near = route
    ? (['<=', ['distance', { type: 'LineString', coordinates: route.geometry.coordinates }], CORRIDOR_M] as FilterSpecification)
    : undefined;
  for (const [layer, original] of state.filters) {
    if (!map.getLayer(layer)) continue;
    const filter = near ? (original ? (['all', original, near] as FilterSpecification) : near) : original;
    map.setFilter(layer, filter ?? null);
  }
  if (map.getLayer('building-3d') && state.colours.walls !== undefined) {
    map.setPaintProperty('building-3d', 'fill-extrusion-color', route && colour ? colour.tint : state.colours.walls);
  }
  if (map.getLayer('building-roof') && state.colours.roof !== undefined) {
    map.setPaintProperty('building-roof', 'fill-extrusion-color', route && colour ? colour.roof : state.colours.roof);
  }
  if (map.getLayer(VEIL_LAYER)) map.setPaintProperty(VEIL_LAYER, 'fill-opacity', route ? VEIL_OPACITY : 0);
}
