import { Marker, type FilterSpecification, type GeoJSONSource, type LngLatBoundsLike, type Map, type PaddingOptions } from 'maplibre-gl';
import type { Route } from '../api/contract';
import { routeColour, routeLetter } from './routeColours';

/**
 * Candidate routes: the selected one like Google Maps' (a darker edge in its own colour around a
 * lighter centre); the others thin, dimmed lines in their lighter colour; stops are numbered
 * circles on a stem with a soft halo.
 */
const ROUTE_SOURCE = 'candidate-routes';

// Minimal GeoJSON shapes (the geojson type package isn't a direct dependency).
type Feature = { type: 'Feature'; properties: Record<string, unknown>; geometry: Route['geometry'] };
type Collection = { type: 'FeatureCollection'; features: Feature[] };
const empty = (): Collection => ({ type: 'FeatureCollection', features: [] });
type PointFeature = { type: 'Feature'; properties: Record<string, unknown>; geometry: { type: 'Point'; coordinates: [number, number] } };

/** Stops of the routes that are not selected, as plain points; the selected route has numbered markers. */
const OTHER_STOPS_SOURCE = 'candidate-route-stops';

function otherStopFeatures(routes: Route[], selectedId: string | undefined): { type: 'FeatureCollection'; features: PointFeature[] } {
  return {
    type: 'FeatureCollection',
    features: routes.filter(route => route.id !== selectedId).flatMap(route => {
      const { fill } = routeColour(routes, route.id);
      const places = new globalThis.Map(route.places.map(place => [place.id, place]));
      return route.stops.flatMap((stop): PointFeature[] => {
        const place = places.get(stop.place_id);
        if (!place) return [];
        return [{ type: 'Feature', properties: { fill }, geometry: { type: 'Point', coordinates: [place.longitude, place.latitude] } }];
      });
    }),
  };
}

/** Line features for every candidate; the selected one draws last. */
function routeFeatures(routes: Route[], selectedId: string | undefined): Collection {
  const sorted = [...routes].sort((a, b) => Number(a.id === selectedId) - Number(b.id === selectedId));
  return {
    type: 'FeatureCollection',
    features: sorted.map((route): Feature => {
      const colour = routeColour(routes, route.id);
      return {
        type: 'Feature',
        properties: { id: route.id, selected: route.id === selectedId, casing: colour.casing, fill: colour.fill },
        geometry: route.geometry,
      };
    }),
  };
}

/** Adds the route layers once. */
function ensureLayers(map: Map): void {
  if (map.getSource(ROUTE_SOURCE)) return;
  map.addSource(ROUTE_SOURCE, { type: 'geojson', data: empty() });
  const isSelected = ['==', ['get', 'selected'], true] as FilterSpecification;
  const notSelected = ['==', ['get', 'selected'], false] as FilterSpecification;
  // The others: a thin, dimmed line in the route's lighter colour, no edge, so the selected one leads.
  map.addLayer({
    id: 'route-other-fill',
    type: 'line',
    source: ROUTE_SOURCE,
    filter: notSelected,
    layout: { 'line-cap': 'round', 'line-join': 'round' },
    paint: { 'line-color': ['get', 'fill'], 'line-width': 2.5, 'line-opacity': 0.7 },
  });
  // Their stops as small circles: no numbers and no mouse handlers, so they only show where the route goes.
  map.addSource(OTHER_STOPS_SOURCE, { type: 'geojson', data: empty() });
  map.addLayer({
    id: 'route-other-stops',
    type: 'circle',
    source: OTHER_STOPS_SOURCE,
    paint: {
      'circle-radius': 3.5,
      'circle-color': ['get', 'fill'],
      'circle-opacity': 0.7,
    },
  });
  map.addLayer({
    id: 'route-casing',
    type: 'line',
    source: ROUTE_SOURCE,
    filter: isSelected,
    layout: { 'line-cap': 'round', 'line-join': 'round' },
    paint: { 'line-color': ['get', 'casing'], 'line-width': 8 },
  });
  map.addLayer({
    id: 'route-fill',
    type: 'line',
    source: ROUTE_SOURCE,
    filter: isSelected,
    layout: { 'line-cap': 'round', 'line-join': 'round' },
    paint: { 'line-color': ['get', 'fill'], 'line-width': 4.5 },
  });
}

// ---------- Stop markers: numbered circles on a stem ----------
const stopHandlers = new WeakMap<Map, (placeId: string) => void>();
const stopMarkers = new WeakMap<Map, Marker[]>();
/** Which selection the stop markers show, so they're only rebuilt when it changes. */
const shownStops = new WeakMap<Map, string>();

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

function showLetters(map: Map, routes: Route[], selectedId: string | undefined): void {
  for (const marker of letterMarkers.get(map) ?? []) marker.remove();
  const markers = routes.flatMap(route => {
    const point = halfway(route.geometry.coordinates);
    if (!point) return [];
    const badge = document.createElement('span');
    badge.className = `route-letter${route.id === selectedId ? ' route-letter--selected' : ''}`;
    badge.style.setProperty('--route', routeColour(routes, route.id).line);
    badge.setAttribute('aria-hidden', 'true'); // the route switch names the routes for screen readers
    badge.textContent = routeLetter(routes, route.id);
    return [new Marker({ element: badge }).setLngLat(point).addTo(map)];
  });
  letterMarkers.set(map, markers);
}

/** Draws the candidates and highlights `selectedId`. Safe to call before the style loads. */
export function showRoutes(map: Map, routes: Route[], selectedId: string | undefined): void {
  const apply = () => {
    ensureLayers(map);
    (map.getSource(ROUTE_SOURCE) as GeoJSONSource).setData(routeFeatures(routes, selectedId));
    (map.getSource(OTHER_STOPS_SOURCE) as GeoJSONSource).setData(otherStopFeatures(routes, selectedId));
    showLetters(map, routes, selectedId);
    const selected = routes.find(route => route.id === selectedId);
    const key = selected ? `${selectedId}|${routes.map(route => route.id).join(',')}` : '';
    if (shownStops.get(map) !== key) {
      shownStops.set(map, key);
      showStops(map, selected, routeColour(routes, selectedId).line);
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
