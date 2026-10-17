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
        properties: { order: String(stop.order), name: place.name },
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
    paint: { 'line-color': '#7fb4e6', 'line-width': 16, 'line-blur': 10, 'line-opacity': 0.75 },
  });
  map.addLayer({
    // Dark casing keeps both lines readable on the bright game-map ground.
    id: 'route-casing',
    type: 'line',
    source: ROUTE_SOURCE,
    layout: { 'line-cap': 'round', 'line-join': 'round' },
    paint: { 'line-color': '#0b1220', 'line-width': ['case', selected, 8, 6], 'line-opacity': ['case', selected, 0.95, 0.6] },
  });
  map.addLayer({
    id: 'route-line',
    type: 'line',
    source: ROUTE_SOURCE,
    layout: { 'line-cap': 'round', 'line-join': 'round' },
    paint: { 'line-color': ['case', selected, '#ffffff', '#7fb4e6'], 'line-width': ['case', selected, 4, 3] },
  });
  map.addLayer({
    id: 'route-stop',
    type: 'circle',
    source: STOP_SOURCE,
    paint: {
      'circle-radius': 12,
      'circle-color': '#0b1220',
      'circle-stroke-color': '#ffffff',
      'circle-stroke-width': 2,
    },
  });
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

/** Draws the candidates and highlights `selectedId`. Safe to call before the style loads. */
export function showRoutes(map: Map, routes: Route[], selectedId: string | undefined): void {
  const apply = () => {
    ensureLayers(map);
    (map.getSource(ROUTE_SOURCE) as GeoJSONSource).setData(routeFeatures(routes, selectedId));
    (map.getSource(STOP_SOURCE) as GeoJSONSource).setData(stopFeatures(routes.find(route => route.id === selectedId)));
  };
  if (map.isStyleLoaded()) apply();
  else map.once('load', apply);
}

/** Moves the camera so the route fits between the floating panels. */
export function fitRoute(map: Map, route: Route, padding: PaddingOptions): void {
  const coordinates = route.geometry.coordinates;
  if (coordinates.length === 0) return;
  const lngs = coordinates.map(([lng]) => lng);
  const lats = coordinates.map(([, lat]) => lat);
  const bounds: LngLatBoundsLike = [[Math.min(...lngs), Math.min(...lats)], [Math.max(...lngs), Math.max(...lats)]];
  map.fitBounds(bounds, { padding, pitch: 50, bearing: -20, maxZoom: 16, duration: 600 });
}
