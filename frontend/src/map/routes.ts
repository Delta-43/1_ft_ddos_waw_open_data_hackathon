import { Marker, type FilterSpecification, type GeoJSONSource, type LngLatBoundsLike, type Map, type PaddingOptions } from 'maplibre-gl';
import type { Route } from '../api/contract';
import { routeColour } from './routeColours';

/**
 * Candidate routes in the style of Delta's mockup (mockups/warsaw-2076): the selected route is a
 * thick dashed line in its own colour on a white casing; the others are thin and muted; stops are
 * numbered circles on a stem with a soft halo.
 */
const ROUTE_SOURCE = 'candidate-routes';

// Minimal GeoJSON shapes (the geojson type package isn't a direct dependency).
type Feature = { type: 'Feature'; properties: Record<string, unknown>; geometry: Route['geometry'] };
type Collection = { type: 'FeatureCollection'; features: Feature[] };
const empty = (): Collection => ({ type: 'FeatureCollection', features: [] });

/** Line features for every candidate; the selected one draws last. */
function routeFeatures(routes: Route[], selectedId: string | undefined): Collection {
  const sorted = [...routes].sort((a, b) => Number(a.id === selectedId) - Number(b.id === selectedId));
  return {
    type: 'FeatureCollection',
    features: sorted.map((route): Feature => ({
      type: 'Feature',
      properties: { id: route.id, selected: route.id === selectedId, colour: routeColour(routes, route.id).line },
      geometry: route.geometry,
    })),
  };
}

// Dash patterns that, played in order, make the dash appear to travel along the line.
const DASH_STEPS: number[][] = [
  [0, 4, 3], [0.5, 4, 2.5], [1, 4, 2], [1.5, 4, 1.5], [2, 4, 1], [2.5, 4, 0.5], [3, 4, 0],
  [0, 0.5, 3, 3.5], [0, 1, 3, 3], [0, 1.5, 3, 2.5], [0, 2, 3, 2], [0, 2.5, 3, 1.5], [0, 3, 3, 1], [0, 3.5, 3, 0.5],
];
/** The resting dash, like the mockup's. */
const DASH_REST = [2, 1.2];

/** Adds the route layers once. */
function ensureLayers(map: Map): void {
  if (map.getSource(ROUTE_SOURCE)) return;
  map.addSource(ROUTE_SOURCE, { type: 'geojson', data: empty() });
  const isSelected = ['==', ['get', 'selected'], true] as FilterSpecification;
  const notSelected = ['==', ['get', 'selected'], false] as FilterSpecification;
  map.addLayer({
    id: 'route-other',
    type: 'line',
    source: ROUTE_SOURCE,
    filter: notSelected,
    layout: { 'line-cap': 'round', 'line-join': 'round' },
    paint: { 'line-color': '#8f9a94', 'line-width': 3, 'line-opacity': 0.7 },
  });
  map.addLayer({
    id: 'route-casing',
    type: 'line',
    source: ROUTE_SOURCE,
    filter: isSelected,
    layout: { 'line-cap': 'round', 'line-join': 'round' },
    paint: { 'line-color': '#ffffff', 'line-width': 10, 'line-opacity': 0.9 },
  });
  map.addLayer({
    id: 'route-dash',
    type: 'line',
    source: ROUTE_SOURCE,
    filter: isSelected,
    layout: { 'line-cap': 'butt', 'line-join': 'round' },
    paint: { 'line-color': ['get', 'colour'], 'line-width': 6, 'line-dasharray': DASH_REST },
  });
}

// ---------- Brief "travelling dash" after selecting a route ----------
const FRAME_MS = 80;
// Only briefly: continuous repaints would keep MapLibre from ever reaching 'idle', which the
// building-outline scan relies on.
const ANIMATION_MS = 4000;
const animations = new WeakMap<Map, number>();
const animatedKeys = new WeakMap<Map, string>();

function stopAnimation(map: Map): void {
  const running = animations.get(map);
  if (running !== undefined) window.clearInterval(running);
  animations.delete(map);
  if (map.getLayer('route-dash')) map.setPaintProperty('route-dash', 'line-dasharray', DASH_REST);
}

function animateSelected(map: Map, active: boolean): void {
  stopAnimation(map);
  if (!active || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  let step = 0;
  const started = performance.now();
  const timer = window.setInterval(() => {
    if (!map.getLayer('route-dash') || performance.now() - started > ANIMATION_MS) {
      stopAnimation(map);
      return;
    }
    step = (step + 1) % DASH_STEPS.length;
    map.setPaintProperty('route-dash', 'line-dasharray', DASH_STEPS[step]);
  }, FRAME_MS);
  animations.set(map, timer);
  map.once('remove', () => window.clearInterval(timer));
}

// ---------- Stop markers: numbered circles on a stem ----------
const stopHandlers = new WeakMap<Map, (placeId: string) => void>();
const stopMarkers = new WeakMap<Map, Marker[]>();

/** Calls `handler` with the place id when a numbered stop is clicked (or activated by keyboard). */
export function onStopClick(map: Map, handler: (placeId: string) => void): void {
  stopHandlers.set(map, handler);
}

function showStops(map: Map, route: Route | undefined, colour: string): void {
  for (const marker of stopMarkers.get(map) ?? []) marker.remove();
  if (!route) {
    stopMarkers.delete(map);
    return;
  }
  const places = new globalThis.Map(route.places.map(place => [place.id, place]));
  const markers = [...route.stops].sort((a, b) => a.order - b.order).flatMap(stop => {
    const place = places.get(stop.place_id);
    if (!place) return [];
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'stop-marker';
    button.style.setProperty('--route', colour);
    button.setAttribute('aria-label', `Stop ${stop.order}: ${place.name}`);
    button.dataset.placeId = place.id;
    const badge = document.createElement('span');
    badge.className = 'stop-marker__badge';
    badge.textContent = String(stop.order);
    const stem = document.createElement('span');
    stem.className = 'stop-marker__stem';
    button.append(badge, stem);
    button.addEventListener('click', event => {
      event.stopPropagation(); // don't let the map also treat it as a click on a city pin
      stopHandlers.get(map)?.(place.id);
    });
    return [new Marker({ element: button, anchor: 'bottom' }).setLngLat([place.longitude, place.latitude]).addTo(map)];
  });
  stopMarkers.set(map, markers);
}

/** Draws the candidates and highlights `selectedId`. Safe to call before the style loads. */
export function showRoutes(map: Map, routes: Route[], selectedId: string | undefined): void {
  const apply = () => {
    ensureLayers(map);
    (map.getSource(ROUTE_SOURCE) as GeoJSONSource).setData(routeFeatures(routes, selectedId));
    const selected = routes.find(route => route.id === selectedId);
    const key = selected ? `${selectedId}|${routes.map(route => route.id).join(',')}` : '';
    if (animatedKeys.get(map) !== key) {
      animatedKeys.set(map, key);
      showStops(map, selected, routeColour(routes, selectedId).line);
      animateSelected(map, key !== '');
    }
  };
  // Once our layers exist, update at once. isStyleLoaded() is false while any source is still
  // loading (even our own GeoJSON just after setData), and 'load' never fires again, so waiting
  // for it here would drop the update; 'idle' always comes.
  if (map.getSource(ROUTE_SOURCE) || map.isStyleLoaded()) apply();
  else map.once('idle', apply);
}

/** Closest overview for a selected route, so its 3D corridor is visible (route focus). */
const MIN_FOCUS_ZOOM = 14.4;

/** Moves the camera so the route fits between the floating panels, but never so far out that the corridor disappears. */
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
