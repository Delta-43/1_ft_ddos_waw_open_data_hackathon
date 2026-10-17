import type { ExpressionSpecification, FilterSpecification, GeoJSONSource, LngLatBoundsLike, Map, PaddingOptions } from 'maplibre-gl';
import type { Route } from '../api/contract';
import { TILES } from './config';

const ROUTE_SOURCE = 'candidate-routes';
const STOP_SOURCE = 'candidate-stops';

// Minimal GeoJSON shapes (the geojson type package isn't a direct dependency).
type Feature =
  | { type: 'Feature'; properties: Record<string, unknown>; geometry: Route['geometry'] }
  | { type: 'Feature'; properties: Record<string, unknown>; geometry: { type: 'Point'; coordinates: [number, number] } };
type Collection = { type: 'FeatureCollection'; features: Feature[] };
const empty = (): Collection => ({ type: 'FeatureCollection', features: [] });

/** Line features for every candidate; the selected one draws last and brightest. */
function routeFeatures(routes: Route[], selectedId: string | undefined): Collection {
  const sorted = [...routes].sort((a, b) => Number(a.id === selectedId) - Number(b.id === selectedId));
  return {
    type: 'FeatureCollection',
    features: sorted.map((route): Feature => ({
      type: 'Feature',
      properties: { id: route.id, selected: route.id === selectedId },
      geometry: route.geometry,
    })),
  };
}

/** Numbered stop points for the selected route, in visit order. */
function stopFeatures(route: Route | undefined): Collection {
  if (!route) return empty();
  const places = new globalThis.Map(route.places.map(place => [place.id, place]));
  return {
    type: 'FeatureCollection',
    features: [...route.stops].sort((a, b) => a.order - b.order).flatMap(stop => {
      const place = places.get(stop.place_id);
      if (!place) return [];
      return [{
        type: 'Feature' as const,
        properties: { order: String(stop.order), name: place.name, placeId: place.id },
        geometry: { type: 'Point' as const, coordinates: [place.longitude, place.latitude] },
      }];
    }),
  };
}

/** Adds the route layers once. Glow only ever marks data: the selected line and its stops. */
function ensureLayers(map: Map): void {
  if (map.getSource(ROUTE_SOURCE)) return;
  map.addSource(ROUTE_SOURCE, { type: 'geojson', data: empty() });
  map.addSource(STOP_SOURCE, { type: 'geojson', data: empty() });
  const selected: ExpressionSpecification = ['get', 'selected'];
  map.addLayer({
    id: 'route-glow',
    type: 'line',
    source: ROUTE_SOURCE,
    filter: ['==', selected, true] as FilterSpecification,
    layout: { 'line-cap': 'round', 'line-join': 'round' },
    paint: { 'line-color': '#8ab4f8', 'line-width': 16, 'line-blur': 10, 'line-opacity': 0.75 },
  });
  map.addLayer({
    // Dark casing keeps both lines readable on the bright game-map ground.
    id: 'route-casing',
    type: 'line',
    source: ROUTE_SOURCE,
    layout: { 'line-cap': 'round', 'line-join': 'round' },
    paint: { 'line-color': '#161717', 'line-width': ['case', selected, 8, 6], 'line-opacity': ['case', selected, 0.95, 0.6] },
  });
  map.addLayer({
    id: 'route-line',
    type: 'line',
    source: ROUTE_SOURCE,
    layout: { 'line-cap': 'round', 'line-join': 'round' },
    paint: { 'line-color': ['case', selected, '#ffffff', '#8ab4f8'], 'line-width': ['case', selected, 4, 3] },
  });
  map.addLayer({
    // A white dash that runs along the selected route, like a game GPS path.
    id: 'route-flow',
    type: 'line',
    source: ROUTE_SOURCE,
    filter: ['==', selected, true] as FilterSpecification,
    layout: { 'line-cap': 'butt', 'line-join': 'round' },
    paint: { 'line-color': '#ffffff', 'line-width': 2.5, 'line-dasharray': DASH_STEPS[0] },
  });
  map.addLayer({
    id: 'route-stop',
    type: 'circle',
    source: STOP_SOURCE,
    paint: {
      'circle-radius': 12,
      'circle-color': '#161717',
      'circle-stroke-color': '#ffffff',
      'circle-stroke-width': 2,
    },
  });
  listenToStops(map);
  map.addLayer({
    id: 'route-stop-number',
    type: 'symbol',
    source: STOP_SOURCE,
    layout: {
      'text-field': ['get', 'order'],
      'text-font': TILES.font,
      'text-size': 13,
      'text-allow-overlap': true,
      'text-ignore-placement': true,
    },
    paint: { 'text-color': '#ffffff' },
  });
}

const stopHandlers = new WeakMap<Map, (placeId: string) => void>();

// Dash patterns that, played in order, make the dash appear to travel along the line.
const DASH_STEPS: number[][] = [
  [0, 4, 3], [0.5, 4, 2.5], [1, 4, 2], [1.5, 4, 1.5], [2, 4, 1], [2.5, 4, 0.5], [3, 4, 0],
  [0, 0.5, 3, 3.5], [0, 1, 3, 3], [0, 1.5, 3, 2.5], [0, 2, 3, 2], [0, 2.5, 3, 1.5], [0, 3, 3, 1], [0, 3.5, 3, 0.5],
];
const FRAME_MS = 80;
// Animate only briefly after a selection: continuous repaints would keep the map from ever
// reaching 'idle', which the building scans (outlines, route focus) rely on.
const ANIMATION_MS = 6000;
const animations = new WeakMap<Map, number>();
const animatedKeys = new WeakMap<Map, string>();

function stopAnimation(map: Map): void {
  const running = animations.get(map);
  if (running !== undefined) window.clearInterval(running);
  animations.delete(map);
  if (map.getLayer('route-glow')) map.setPaintProperty('route-glow', 'line-opacity', 0.75);
}

/** Runs the dash and a soft glow pulse for a few seconds after a route is selected. */
function animateSelected(map: Map, active: boolean): void {
  stopAnimation(map);
  if (!active || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  let step = 0;
  const started = performance.now();
  const timer = window.setInterval(() => {
    if (!map.getLayer('route-flow') || performance.now() - started > ANIMATION_MS) {
      stopAnimation(map);
      return;
    }
    step = (step + 1) % DASH_STEPS.length;
    map.setPaintProperty('route-flow', 'line-dasharray', DASH_STEPS[step]);
    map.setPaintProperty('route-glow', 'line-opacity', 0.6 + 0.25 * Math.sin((step / DASH_STEPS.length) * 2 * Math.PI));
  }, FRAME_MS);
  animations.set(map, timer);
  map.once('remove', () => window.clearInterval(timer));
}

/** Calls `handler` with the place id when a numbered stop is clicked. Keyboard users use "Show on map" in the stops panel. */
export function onStopClick(map: Map, handler: (placeId: string) => void): void {
  stopHandlers.set(map, handler);
}

function listenToStops(map: Map): void {
  map.on('click', 'route-stop', event => {
    const placeId = event.features?.[0]?.properties?.placeId;
    if (typeof placeId === 'string') stopHandlers.get(map)?.(placeId);
  });
  map.on('mouseenter', 'route-stop', () => { map.getCanvas().style.cursor = 'pointer'; });
  map.on('mouseleave', 'route-stop', () => { map.getCanvas().style.cursor = ''; });
}

/** Draws the candidates and highlights `selectedId`. Safe to call before the style loads. */
export function showRoutes(map: Map, routes: Route[], selectedId: string | undefined): void {
  const apply = () => {
    ensureLayers(map);
    (map.getSource(ROUTE_SOURCE) as GeoJSONSource).setData(routeFeatures(routes, selectedId));
    (map.getSource(STOP_SOURCE) as GeoJSONSource).setData(stopFeatures(routes.find(route => route.id === selectedId)));
    const key = routes.some(route => route.id === selectedId) ? `${selectedId}|${routes.map(route => route.id).join(',')}` : '';
    if (animatedKeys.get(map) !== key) {
      animatedKeys.set(map, key);
      animateSelected(map, key !== '');
    }
  };
  // Once our layers exist, update at once. isStyleLoaded() is false while any source is still
  // loading (even our own GeoJSON just after setData), and 'load' never fires again, so waiting
  // for it here would drop the update; 'idle' always comes.
  if (map.getSource(ROUTE_SOURCE) || map.isStyleLoaded()) apply();
  else map.once('idle', apply);
}

/** Closest overview for a selected route: 3D buildings along it must be visible (route focus). */
const MIN_FOCUS_ZOOM = 14.4;

/** Moves the camera so the route fits between the floating panels, but never so far out that the 3D corridor disappears. */
export function fitRoute(map: Map, route: Route, padding: PaddingOptions): void {
  const coordinates = route.geometry.coordinates;
  if (coordinates.length === 0) return;
  const lngs = coordinates.map(([lng]) => lng);
  const lats = coordinates.map(([, lat]) => lat);
  const bounds: LngLatBoundsLike = [[Math.min(...lngs), Math.min(...lats)], [Math.max(...lngs), Math.max(...lats)]];
  const camera = map.cameraForBounds(bounds, { padding, bearing: -20, maxZoom: 16 });
  if (!camera) return;
  map.easeTo({ ...camera, zoom: Math.max(camera.zoom ?? MIN_FOCUS_ZOOM, MIN_FOCUS_ZOOM), pitch: 55, bearing: -20, duration: 600 });
}
