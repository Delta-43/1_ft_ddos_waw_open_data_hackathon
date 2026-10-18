import { Marker, type FilterSpecification, type GeoJSONSource, type LngLatBoundsLike, type Map, type PaddingOptions } from 'maplibre-gl';
import type { Route } from '../api/contract';
import { routeColour } from './routeColours';

/**
 * Candidate routes: the selected one like Google Maps' (a darker edge in its own colour around a
 * lighter centre); the others thin, dimmed lines in their lighter colour. The selected route's
 * stops are small glowing rings on the ground, without numbers (#114): you tap the building itself.
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

// ---------- Stop markers: glowing rings at the stop; a tap on its building also opens it ----------
const stopHandlers = new WeakMap<Map, (placeId: string) => void>();
const stopMarkers = new WeakMap<Map, Marker[]>();
/** Which selection the stop markers show, so they're only rebuilt when it changes. */
const shownStops = new WeakMap<Map, string>();

/** Stops of the selected route, for matching a tap on a building to the nearest stop. */
const stopPoints = new WeakMap<Map, { placeId: string; lng: number; lat: number }[]>();
/** A tap on a building opens the stop within this distance of the tap. */
const BUILDING_TAP_M = 70;
const BUILDING_LAYERS = ['building-3d', 'building-roof'];

/** Calls `handler` with the place id when a stop, or the building at a stop, is tapped (or a stop is activated by keyboard). */
export function onStopClick(map: Map, handler: (placeId: string) => void): void {
  stopHandlers.set(map, handler);
  map.on('click', event => {
    const stops = stopPoints.get(map);
    if (!stops?.length) return;
    const layers = BUILDING_LAYERS.filter(id => map.getLayer(id));
    if (!layers.length || !map.queryRenderedFeatures(event.point, { layers }).length) return;
    const metresPerLng = 111_320 * Math.cos((event.lngLat.lat * Math.PI) / 180);
    const nearest = stops
      .map(stop => ({ stop, metres: Math.hypot((stop.lng - event.lngLat.lng) * metresPerLng, (stop.lat - event.lngLat.lat) * 110_540) }))
      .sort((a, b) => a.metres - b.metres)[0];
    if (nearest.metres <= BUILDING_TAP_M) handler(nearest.stop.placeId);
  });
}

function showStops(map: Map, route: Route | undefined, colour: string): void {
  for (const marker of stopMarkers.get(map) ?? []) marker.remove();
  if (!route) {
    stopMarkers.delete(map);
    stopPoints.delete(map);
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
    const ring = document.createElement('span');
    ring.className = 'stop-marker__ring';
    button.append(ring);
    button.addEventListener('click', event => {
      event.stopPropagation(); // don't let the map also treat it as a click on a city pin
      stopHandlers.get(map)?.(place.id);
    });
    return [new Marker({ element: button }).setLngLat([place.longitude, place.latitude]).addTo(map)];
  });
  stopMarkers.set(map, markers);
  stopPoints.set(map, route.places.map(place => ({ placeId: place.id, lng: place.longitude, lat: place.latitude })));
}

/** Draws the candidates and highlights `selectedId`. Safe to call before the style loads. */
export function showRoutes(map: Map, routes: Route[], selectedId: string | undefined): void {
  const apply = () => {
    ensureLayers(map);
    (map.getSource(ROUTE_SOURCE) as GeoJSONSource).setData(routeFeatures(routes, selectedId));
    (map.getSource(OTHER_STOPS_SOURCE) as GeoJSONSource).setData(otherStopFeatures(routes, selectedId));
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
