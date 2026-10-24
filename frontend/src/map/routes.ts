import { Marker, type ExpressionSpecification, type FilterSpecification, type GeoJSONSource, type LngLatBoundsLike, type Map, type PaddingOptions } from 'maplibre-gl';
import type { Route } from '../api/contract';
import { routeColour, routeLetter } from './routeColours';

/**
 * Candidate routes as light on the dark map: the selected route is a bright core in its own
 * colour inside a wide soft glow, with white dashes that travel briefly after selection; the
 * others are thin and dim. Stops are numbered circles on a stem with a soft halo.
 */
const ROUTE_SOURCE = 'candidate-routes';

// Minimal GeoJSON shapes (the geojson type package isn't a direct dependency).
type Feature = { type: 'Feature'; properties: Record<string, unknown>; geometry: Route['geometry'] };
type Collection = { type: 'FeatureCollection'; features: Feature[] };
const empty = (): Collection => ({ type: 'FeatureCollection', features: [] });

/** The selected route takes the mood accent when there is one; the others keep their rank colour. */
function lineColour(routes: Route[], id: string | undefined, selectedId: string | undefined, accent?: string): string {
  return accent && id === selectedId ? accent : routeColour(routes, id).line;
}

/** Line features for every candidate; the selected one draws last. */
function routeFeatures(routes: Route[], selectedId: string | undefined, accent?: string): Collection {
  const sorted = [...routes].sort((a, b) => Number(a.id === selectedId) - Number(b.id === selectedId));
  return {
    type: 'FeatureCollection',
    features: sorted.map((route): Feature => ({
      type: 'Feature',
      properties: { id: route.id, selected: route.id === selectedId, colour: lineColour(routes, route.id, selectedId, accent) },
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
  // lineMetrics enables line-progress, which the drawing animation reads.
  map.addSource(ROUTE_SOURCE, { type: 'geojson', data: empty(), lineMetrics: true });
  const isSelected = ['==', ['get', 'selected'], true] as FilterSpecification;
  const notSelected = ['==', ['get', 'selected'], false] as FilterSpecification;
  map.addLayer({
    id: 'route-other',
    type: 'line',
    source: ROUTE_SOURCE,
    filter: notSelected,
    layout: { 'line-cap': 'round', 'line-join': 'round' },
    paint: { 'line-color': ['get', 'colour'], 'line-width': 2.5, 'line-opacity': 0.4 },
  });
  map.addLayer({
    id: 'route-glow',
    type: 'line',
    source: ROUTE_SOURCE,
    filter: isSelected,
    layout: { 'line-cap': 'round', 'line-join': 'round' },
    paint: { 'line-color': ['get', 'colour'], 'line-width': 22, 'line-blur': 14, 'line-opacity': 0.55 },
  });
  map.addLayer({
    id: 'route-core',
    type: 'line',
    source: ROUTE_SOURCE,
    filter: isSelected,
    layout: { 'line-cap': 'round', 'line-join': 'round' },
    paint: { 'line-color': ['get', 'colour'], 'line-width': 5 },
  });
  map.addLayer({
    id: 'route-dash',
    type: 'line',
    source: ROUTE_SOURCE,
    filter: isSelected,
    layout: { 'line-cap': 'butt', 'line-join': 'round' },
    paint: { 'line-color': '#fff8ee', 'line-width': 1.6, 'line-opacity': 0.85, 'line-dasharray': DASH_REST },
  });
}

// ---------- Drawing: the selected route runs from start to end with a bright head ----------
const DRAW_MS = 1700;
const draws = new WeakMap<Map, number>();

/** Gradient along the selected line: solid up to `front`, a white-hot head, nothing after. */
function drawn(colour: string, front: number): ExpressionSpecification {
  if (front >= 1) return ['interpolate', ['linear'], ['line-progress'], 0, colour, 1, colour];
  const head = Math.max(front, 0.0001);
  const tail = Math.max(0, head - 0.04);
  const stops: (number | string)[] = tail > 0 ? [0, colour, tail, colour] : [0, colour];
  return ['interpolate', ['linear'], ['line-progress'], ...stops, head, '#fff8ee', Math.min(1, head + 0.0001), 'rgba(0,0,0,0)', ...(head + 0.0001 < 1 ? [1, 'rgba(0,0,0,0)'] : [])] as ExpressionSpecification;
}

function drawSelected(map: Map, colour: string, animate: boolean): void {
  cancelAnimationFrame(draws.get(map) ?? 0);
  const paint = (front: number) => {
    for (const layer of ['route-core', 'route-glow']) if (map.getLayer(layer)) map.setPaintProperty(layer, 'line-gradient', drawn(colour, front));
    if (map.getLayer('route-dash')) map.setPaintProperty('route-dash', 'line-opacity', front >= 1 ? 0.85 : 0);
  };
  if (!animate || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    paint(1);
    return;
  }
  const started = performance.now();
  const frame = (now: number) => {
    const t = Math.min(1, (now - started) / DRAW_MS);
    paint(1 - (1 - t) ** 3);
    if (t < 1) draws.set(map, requestAnimationFrame(frame));
    else draws.delete(map);
  };
  paint(0);
  draws.set(map, requestAnimationFrame(frame));
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
    // No number on the map: the order is in the button's label and in the panel's list.
    if (stop.order === route.stops.length) button.classList.add('stop-marker--end');
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

// ---------- Route letters: A, B, C halfway along each candidate ----------
const letterMarkers = new WeakMap<Map, Marker[]>();

/** The point halfway along a line, by length, so the letter doesn't sit on a stop. */
function halfway(coordinates: [number, number][]): [number, number] | undefined {
  const lengths = coordinates.slice(1).map((point, index) => Math.hypot(point[0] - coordinates[index][0], point[1] - coordinates[index][1]));
  let remaining = lengths.reduce((sum, length) => sum + length, 0) / 2;
  for (const [index, length] of lengths.entries()) {
    if (remaining <= length && length > 0) {
      const [[x1, y1], [x2, y2]] = [coordinates[index], coordinates[index + 1]];
      const t = remaining / length;
      return [x1 + (x2 - x1) * t, y1 + (y2 - y1) * t];
    }
    remaining -= length;
  }
  return coordinates[0];
}

function showLetters(map: Map, routes: Route[], selectedId: string | undefined, accent?: string): void {
  for (const marker of letterMarkers.get(map) ?? []) marker.remove();
  const markers = routes.flatMap(route => {
    const point = halfway(route.geometry.coordinates);
    if (!point) return [];
    const badge = document.createElement('span');
    badge.className = `route-letter${route.id === selectedId ? ' route-letter--selected' : ''}`;
    badge.style.setProperty('--route', lineColour(routes, route.id, selectedId, accent));
    badge.setAttribute('aria-hidden', 'true'); // the route switch names the routes for screen readers
    badge.textContent = routeLetter(routes, route.id);
    return [new Marker({ element: badge }).setLngLat(point).addTo(map)];
  });
  letterMarkers.set(map, markers);
}

/** Draws the candidates and highlights `selectedId`. Safe to call before the style loads. */
export function showRoutes(map: Map, routes: Route[], selectedId: string | undefined, accent?: string): void {
  const apply = () => {
    ensureLayers(map);
    (map.getSource(ROUTE_SOURCE) as GeoJSONSource).setData(routeFeatures(routes, selectedId, accent));
    // A single candidate needs no letter.
    showLetters(map, routes.length > 1 ? routes : [], selectedId, accent);
    const selected = routes.find(route => route.id === selectedId);
    const key = selected ? `${selectedId}|${routes.map(route => route.id).join(',')}|${accent ?? ''}` : '';
    if (animatedKeys.get(map) !== key) {
      animatedKeys.set(map, key);
      const colour = lineColour(routes, selectedId, selectedId, accent);
      showStops(map, selected, colour);
      if (selected) drawSelected(map, colour, true);
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
const MIN_FOCUS_ZOOM = 13.6;
/** Extra zoom after fitting a flat map, so the tilted route fills the open area. */
const TILT_ZOOM = 0.55;

/** Moves the camera so the route fits between the floating panels, but never so far out that the corridor disappears. */
export function fitRoute(map: Map, route: Route, padding: PaddingOptions): number | undefined {
  const coordinates = route.geometry.coordinates;
  if (coordinates.length === 0) return undefined;
  const lngs = coordinates.map(([lng]) => lng);
  const lats = coordinates.map(([, lat]) => lat);
  const bounds: LngLatBoundsLike = [[Math.min(...lngs), Math.min(...lats)], [Math.max(...lngs), Math.max(...lats)]];
  // Zoom: fit the route into the open area's size (symmetric padding, so only the size counts).
  const wanted = { x: ((padding.left ?? 0) + (padding.right ?? 0)) / 2, y: ((padding.top ?? 0) + (padding.bottom ?? 0)) / 2 };
  // cameraForBounds also subtracts the padding the map already has, and gives up (with a console warning)
  // when nothing is left: e.g. a phone switching routes, with a tall panel and a caption above the route.
  const current = map.getPadding();
  const box = map.getContainer();
  const room = (size: number, taken: number) => Math.max(0, Math.min(taken, (size - 48) / 2));
  const x = room(box.clientWidth - (current.left ?? 0) - (current.right ?? 0), wanted.x);
  const y = room(box.clientHeight - (current.top ?? 0) - (current.bottom ?? 0), wanted.y);
  const camera = map.cameraForBounds(bounds, { padding: { top: y, bottom: y, left: x, right: x }, bearing: -20, maxZoom: 16 });
  if (!camera) return undefined;
  // The fit is computed for a flat map; tilted, the route looks smaller, so move a little closer.
  // A short open area (a phone above its bottom sheet) has no room to spare for that.
  const open = map.getContainer().clientHeight - 2 * y;
  const zoom = Math.min(16, Math.max((camera.zoom ?? MIN_FOCUS_ZOOM) + (open < 420 ? -0.15 : TILT_ZOOM), 13));
  // Centre: the route's own middle, placed in the open area by MapLibre's padding, which stays
  // correct when tilted (a flat-map offset grows towards the horizon and misses on phones).
  const center: [number, number] = [(Math.min(...lngs) + Math.max(...lngs)) / 2, (Math.min(...lats) + Math.max(...lats)) / 2];
  map.easeTo({ center, zoom, padding, pitch: 55, bearing: -20, duration: 1200 });
  return zoom;
}

/** How far a visitor may zoom out past the fitted route, in zoom levels. */
const ZOOM_OUT_ALLOWANCE = 0.7;
/** How far the centre may wander from the route's box before it glides back, in metres. */
const WANDER_M = 900;

/**
 * Keeps the camera on `route` once it has been fitted at `zoom`: no zooming out much past the
 * whole route (fewer tiles, a steadier frame rate) and a gentle return if the centre wanders far
 * away. Returns a function that lifts both limits.
 */
export function holdOnRoute(map: Map, route: Route, zoom: number, defaultMinZoom: number): () => void {
  const lngs = route.geometry.coordinates.map(([lng]) => lng);
  const lats = route.geometry.coordinates.map(([, lat]) => lat);
  const dLng = WANDER_M / (111_320 * Math.cos((52.22 * Math.PI) / 180));
  const dLat = WANDER_M / 110_540;
  const [west, east, south, north] = [Math.min(...lngs) - dLng, Math.max(...lngs) + dLng, Math.min(...lats) - dLat, Math.max(...lats) + dLat];
  const lock = () => map.setMinZoom(Math.max(defaultMinZoom, zoom - ZOOM_OUT_ALLOWANCE));
  const keepNear = (event: { originalEvent?: unknown }) => {
    if (!event.originalEvent) return; // only after the visitor's own moves
    const { lng, lat } = map.getCenter();
    const clamped: [number, number] = [Math.min(east, Math.max(west, lng)), Math.min(north, Math.max(south, lat))];
    if (clamped[0] !== lng || clamped[1] !== lat) map.easeTo({ center: clamped, duration: 700 });
  };
  // Limit only after the fitting flight lands, so it can still zoom out to the route first.
  map.once('moveend', lock);
  map.on('moveend', keepNear);
  return () => {
    map.off('moveend', lock);
    map.off('moveend', keepNear);
    map.setMinZoom(defaultMinZoom);
  };
}
