import { Popup, type ExpressionSpecification, type GeoJSONSource, type Map, type MapLayerMouseEvent } from 'maplibre-gl';
import { getLang } from '../i18n/language';
import { translate, type Key } from '../i18n/translations';
import type { Route } from '../api/contract';
import type { RouteColour } from './routeColours';
import { focusRoute } from './routeFocus';

/**
 * The 3D corridor (#91 D4, option A): buildings, green spaces and trees from a cached OSM
 * extract (public/corridor-cache.json, built by scripts/build_corridor_cache.py) are drawn only
 * near the selected route; the rest of the city lies flat. The geometry is fixed, so nothing
 * changes or rescans with zoom, pan or tilt. Routes outside the cache fall back to routeFocus.ts.
 */
const CACHE_URL = '/corridor-cache.json';
const CORRIDOR_M = 200;
const TREE_RADIUS_M = 3.2;

const SOURCE = 'corridor';
const TREE_SOURCE = 'corridor-trees';
/** Base-map layers that a corridor replaces with flat footprints. */
const CITY_3D = ['building-3d', 'building-roof', 'building-outline'];

const CULTURE = '#63432c';
const CULTURE_TOP = '#92663f';
const GREEN_FILL = '#1d3a26';
const GREEN_EDGE = '#3f9a5f';
const TREE = '#3f8f58';

export type Point = [number, number];
export interface CacheFeature {
  type: 'Feature';
  /** k: b building, g green space, t tree, a amenity (toilets or AED), s shop. */
  properties: { k: 'b' | 'g' | 't' | 'a' | 's'; h?: number; mh?: number; est?: boolean; c?: boolean; [key: string]: unknown };
  geometry: { type: 'Polygon'; coordinates: Point[][] } | { type: 'Point'; coordinates: Point };
}
export interface Cache { bbox: [number, number, number, number]; features: CacheFeature[] }

const M_PER_DEG_LAT = 110_540;
const M_PER_DEG_LNG = 111_320 * Math.cos((52.22 * Math.PI) / 180);
export const toMetres = ([lng, lat]: Point): Point => [lng * M_PER_DEG_LNG, lat * M_PER_DEG_LAT];

let cache: Promise<Cache | null> | undefined;
/** The cached OSM extract, fetched once and shared (also by amenities.ts). */
export function loadCache(): Promise<Cache | null> {
  cache ??= fetch(CACHE_URL)
    .then(response => (response.ok ? (response.json() as Promise<Cache>) : null))
    .catch(() => null);
  return cache;
}

export type Segment = [number, number, number, number];
export function segmentsOf(route: Route): Segment[] {
  const points = route.geometry.coordinates.map(toMetres);
  return points.slice(1).map((point, i) => [points[i][0], points[i][1], point[0], point[1]]);
}

export function near([x, y]: Point, segments: Segment[], limit: number): boolean {
  for (const [ax, ay, bx, by] of segments) {
    // Cheap box test first: most segments are far away.
    if (x < Math.min(ax, bx) - limit || x > Math.max(ax, bx) + limit || y < Math.min(ay, by) - limit || y > Math.max(ay, by) + limit) continue;
    const dx = bx - ax;
    const dy = by - ay;
    const length = dx * dx + dy * dy;
    const t = length === 0 ? 0 : Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / length));
    if (Math.hypot(x - (ax + t * dx), y - (ay + t * dy)) <= limit) return true;
  }
  return false;
}

/** Where a point sits along the route, 0 (start) to 1 (end), by its nearest segment. */
function progressAlong([x, y]: Point, segments: Segment[], starts: number[], total: number): number {
  let best = Infinity;
  let at = 0;
  segments.forEach(([ax, ay, bx, by], i) => {
    const dx = bx - ax;
    const dy = by - ay;
    const length = dx * dx + dy * dy;
    const t = length === 0 ? 0 : Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / length));
    const distance = Math.hypot(x - (ax + t * dx), y - (ay + t * dy));
    if (distance < best) { best = distance; at = starts[i] + t * Math.sqrt(length); }
  });
  return total > 0 ? at / total : 0;
}

function centroid(ring: Point[]): Point {
  let x = 0;
  let y = 0;
  for (const [px, py] of ring) { x += px; y += py; }
  return [x / ring.length, y / ring.length];
}

/** A small octagon around a tree point, extruded into a low-poly crown. */
function crown([lng, lat]: Point): Point[][] {
  const ring: Point[] = [];
  for (let i = 0; i <= 8; i++) {
    const a = (i % 8) * (Math.PI / 4);
    ring.push([lng + (Math.cos(a) * TREE_RADIUS_M) / M_PER_DEG_LNG, lat + (Math.sin(a) * TREE_RADIUS_M) / M_PER_DEG_LAT]);
  }
  return [ring];
}

function covers(bbox: Cache['bbox'], route: Route): boolean {
  const [w, s, e, n] = bbox;
  return route.geometry.coordinates.every(([lng, lat]) => lng >= w && lng <= e && lat >= s && lat <= n);
}

const empty = () => ({ type: 'FeatureCollection' as const, features: [] });

// ---------- Culture buildings: a card on hover (tap on touch screens) ----------
const KIND_KEYS: Record<string, Key> = {
  museum: 'cultureMuseum', gallery: 'cultureGallery', attraction: 'cultureAttraction', theatre: 'cultureTheatre',
  'place of worship': 'cultureWorship', 'arts centre': 'cultureArts', library: 'cultureLibrary', castle: 'cultureCastle',
  palace: 'culturePalace', monument: 'cultureMonument', church: 'cultureChurch', cathedral: 'cultureChurch', chapel: 'cultureChurch',
  manor: 'cultureManor', fort: 'cultureFort', 'city gate': 'cultureGate', ruins: 'cultureRuins', tower: 'cultureTower', synagogue: 'cultureSynagogue',
};

function cultureCard(props: Record<string, unknown>): HTMLElement | null {
  const lang = getLang();
  const t = (key: Key, vars?: Record<string, string | number>) => translate(lang, key, vars);
  const text = (key: string) => (typeof props[key] === 'string' ? (props[key] as string) : undefined);
  const name = (lang === 'pl' ? text('npl') : text('n')) ?? text('n') ?? text('npl');
  if (!name) return null;
  const root = document.createElement('div');
  root.className = 'culture-card';
  const title = document.createElement('p');
  title.className = 'culture-card__title';
  title.textContent = name;
  root.append(title);
  const facts = [
    text('ck') && KIND_KEYS[text('ck')!] ? t(KIND_KEYS[text('ck')!]) : text('ck'),
    text('sd') ? t('cultureSince', { year: text('sd')! }) : undefined,
    text('arch') ? t('cultureArchitect', { name: text('arch')! }) : undefined,
  ].filter(Boolean);
  if (facts.length) {
    const line = document.createElement('p');
    line.className = 'culture-card__facts';
    line.textContent = facts.join(' · ');
    root.append(line);
  }
  if (props.her === true || props.her === 'true') {
    const badge = document.createElement('span');
    badge.className = 'culture-card__badge';
    badge.textContent = t('cultureHeritage');
    root.append(badge);
  }
  // The summary in the interface language when Wikipedia has it, otherwise the other one.
  const own = lang === 'pl' ? 'pl' : 'en';
  const other = own === 'pl' ? 'en' : 'pl';
  const summaryLang = text(`s${own}`) ? own : text(`s${other}`) ? other : null;
  if (summaryLang) {
    const summary = document.createElement('p');
    summary.className = 'culture-card__summary';
    summary.textContent = text(`s${summaryLang}`)!;
    root.append(summary);
  }
  const source = document.createElement('p');
  source.className = 'culture-card__source';
  source.textContent = summaryLang ? t('cultureSourceWiki') : t('cultureSourceOsm');
  root.append(source);
  return root;
}

function initCultureCards(map: Map): void {
  const popup = new Popup({ closeButton: false, closeOnClick: false, offset: 12, className: 'culture-popup', maxWidth: '19rem' });
  let shown: unknown;
  const show = (event: MapLayerMouseEvent) => {
    const feature = event.features?.find(f => f.properties?.c === true || f.properties?.c === 'true');
    if (!feature) return hide();
    map.getCanvas().style.cursor = 'help';
    if (shown === feature.id && popup.isOpen()) return popup.setLngLat(event.lngLat), undefined;
    const card = cultureCard(feature.properties ?? {});
    if (!card) return hide();
    shown = feature.id;
    popup.setLngLat(event.lngLat).setDOMContent(card).addTo(map);
  };
  const hide = () => {
    shown = undefined;
    map.getCanvas().style.cursor = '';
    popup.remove();
  };
  map.on('mousemove', 'corridor-3d', show);
  map.on('mouseleave', 'corridor-3d', hide);
  // Touch screens have no hover: a tap opens the card, a tap elsewhere closes it.
  map.on('click', 'corridor-3d', show);
  map.on('movestart', hide);
}

/** Adds the corridor layers once, under the route lines. Call after the style loads. */
export function initCorridor(map: Map): void {
  void loadCache();
  map.addSource(SOURCE, { type: 'geojson', data: empty(), generateId: true });
  map.addSource(TREE_SOURCE, { type: 'geojson', data: empty() });
  const isKind = (kind: string): ExpressionSpecification => ['==', ['get', 'k'], kind];
  const groundLayer = ['road-glow', 'road-minor'].find(id => map.getLayer(id));
  map.addLayer({ id: 'corridor-green', type: 'fill', source: SOURCE, filter: isKind('g'), paint: { 'fill-color': GREEN_FILL, 'fill-opacity': 0.9 } }, groundLayer);
  map.addLayer({
    id: 'corridor-green-edge',
    type: 'line',
    source: SOURCE,
    filter: isKind('g'),
    paint: { 'line-color': GREEN_EDGE, 'line-opacity': 0.35, 'line-width': 1, 'line-blur': 0.5 },
  }, groundLayer);
  // Flat footprints for the whole city while a corridor is shown (hidden otherwise).
  const above = ['boundary-neighbourhood', 'water-label'].find(id => map.getLayer(id));
  map.addLayer({
    id: 'building-flat',
    type: 'fill',
    source: 'openmaptiles',
    'source-layer': 'building',
    layout: { visibility: 'none' },
    paint: { 'fill-color': '#202125', 'fill-outline-color': '#141416' },
  }, above);
  map.addLayer({
    id: 'corridor-trees',
    type: 'fill-extrusion',
    source: TREE_SOURCE,
    paint: { 'fill-extrusion-color': TREE, 'fill-extrusion-base': 1.5, 'fill-extrusion-height': ['get', 'h'], 'fill-extrusion-vertical-gradient': true },
  }, above);
  map.addLayer({
    id: 'corridor-3d',
    type: 'fill-extrusion',
    source: SOURCE,
    filter: isKind('b'),
    paint: {
      'fill-extrusion-color': ['case', ['get', 'c'], CULTURE, '#353539'],
      'fill-extrusion-height': ['get', 'h'],
      'fill-extrusion-base': ['coalesce', ['get', 'mh'], 0],
      'fill-extrusion-vertical-gradient': true,
    },
  }, above);
  map.addLayer({
    // A thin lit slab on each roof: the "soft top light" of the reference.
    id: 'corridor-roof',
    type: 'fill-extrusion',
    source: SOURCE,
    filter: isKind('b'),
    minzoom: 14.5,
    paint: {
      'fill-extrusion-color': ['case', ['get', 'c'], CULTURE_TOP, '#57575d'],
      'fill-extrusion-base': ['get', 'h'],
      'fill-extrusion-height': ['+', ['get', 'h'], 0.5],
    },
  }, above);
  initCultureCards(map);
}

function setCity3d(map: Map, visible: boolean): void {
  for (const id of CITY_3D) if (map.getLayer(id)) map.setLayoutProperty(id, 'visibility', visible ? 'visible' : 'none');
  if (map.getLayer('building-flat')) map.setLayoutProperty('building-flat', 'visibility', visible ? 'none' : 'visible');
}

// ---------- Reveal: buildings, parks and trees rise in a wave that follows the route ----------
const REVEAL_MS = 1900;
/** How much of the route the wave front spans; wider is softer. */
const WAVE = 0.18;
const reveals = new WeakMap<Map, number>();
const easeOut = (t: number) => 1 - (1 - t) ** 3;

/** 0 → 1 as the wave front `front` passes a feature's position `d` along the route. */
const grown = (front: number): ExpressionSpecification =>
  ['max', 0, ['min', 1, ['/', ['-', front, ['coalesce', ['get', 'd'], 0]], WAVE]]];

function paintAt(map: Map, front: number | null): void {
  const g: ExpressionSpecification | number = front === null ? 1 : grown(front);
  const h = (value: ExpressionSpecification): ExpressionSpecification => (front === null ? value : ['*', value, g as ExpressionSpecification]);
  map.setPaintProperty('corridor-3d', 'fill-extrusion-height', h(['get', 'h']));
  map.setPaintProperty('corridor-3d', 'fill-extrusion-base', h(['coalesce', ['get', 'mh'], 0]));
  map.setPaintProperty('corridor-roof', 'fill-extrusion-base', h(['get', 'h']));
  map.setPaintProperty('corridor-roof', 'fill-extrusion-height', h(['+', ['get', 'h'], 0.5]));
  map.setPaintProperty('corridor-trees', 'fill-extrusion-height', h(['get', 'h']));
  map.setPaintProperty('corridor-green', 'fill-opacity', front === null ? 0.9 : ['*', 0.9, g as ExpressionSpecification]);
  map.setPaintProperty('corridor-green-edge', 'line-opacity', front === null ? 0.35 : ['*', 0.35, g as ExpressionSpecification]);
}

function reveal(map: Map): void {
  cancelAnimationFrame(reveals.get(map) ?? 0);
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    paintAt(map, null);
    return;
  }
  const started = performance.now();
  const frame = (now: number) => {
    if (!map.getLayer('corridor-3d')) return;
    const t = Math.min(1, (now - started) / REVEAL_MS);
    if (t >= 1) {
      paintAt(map, null); // static expressions again: nothing re-evaluates after the reveal
      reveals.delete(map);
      return;
    }
    paintAt(map, easeOut(t) * (1 + WAVE));
    reveals.set(map, requestAnimationFrame(frame));
  };
  paintAt(map, 0);
  reveals.set(map, requestAnimationFrame(frame));
}

let request = 0;

/**
 * Shows the corridor around `route` in its colour (or the whole 3D city again when undefined).
 * Falls back to tile-based route focus when the cache does not cover the route.
 */
export function showCorridor(map: Map, route: Route | undefined, colour?: RouteColour): void {
  const ticket = ++request;
  const clear = () => {
    (map.getSource(SOURCE) as GeoJSONSource | undefined)?.setData(empty());
    (map.getSource(TREE_SOURCE) as GeoJSONSource | undefined)?.setData(empty());
  };
  if (!route) {
    clear();
    setCity3d(map, true);
    focusRoute(map, undefined);
    return;
  }
  void loadCache().then(data => {
    if (ticket !== request || !map.getSource(SOURCE)) return;
    if (!data || !covers(data.bbox, route)) {
      clear();
      setCity3d(map, true);
      focusRoute(map, route, colour);
      return;
    }
    focusRoute(map, undefined);
    const segments = segmentsOf(route);
    const starts: number[] = [];
    let total = 0;
    for (const [ax, ay, bx, by] of segments) { starts.push(total); total += Math.hypot(bx - ax, by - ay); }
    const along = (point: Point) => progressAlong(toMetres(point), segments, starts, total);
    const shapes: unknown[] = [];
    const trees: unknown[] = [];
    for (const feature of data.features) {
      const { k } = feature.properties;
      if (feature.geometry.type === 'Point') {
        if (k === 't' && near(toMetres(feature.geometry.coordinates), segments, CORRIDOR_M)) {
          // Stable pseudo-random height per tree, 6–10 m.
          const [lng, lat] = feature.geometry.coordinates;
          const h = 6 + (Math.abs(Math.sin(lng * 9137 + lat * 4271)) * 4);
          trees.push({ type: 'Feature', properties: { h, d: along(feature.geometry.coordinates) }, geometry: { type: 'Polygon', coordinates: crown(feature.geometry.coordinates) } });
        }
        continue;
      }
      const ring = feature.geometry.coordinates[0];
      const withProgress = (point: Point) => ({ ...feature, properties: { ...feature.properties, d: along(point) } });
      if (k === 'b') {
        const middle = centroid(ring);
        if (near(toMetres(middle), segments, CORRIDOR_M)) shapes.push(withProgress(middle));
      } else {
        // Green spaces: keep the whole shape when any part of it touches the corridor.
        const step = Math.max(1, Math.floor(ring.length / 24));
        for (let i = 0; i < ring.length; i += step) {
          if (near(toMetres(ring[i]), segments, CORRIDOR_M)) { shapes.push(withProgress(ring[i])); break; }
        }
      }
    }
    (map.getSource(SOURCE) as GeoJSONSource).setData({ type: 'FeatureCollection', features: shapes } as never);
    (map.getSource(TREE_SOURCE) as GeoJSONSource).setData({ type: 'FeatureCollection', features: trees } as never);
    if (colour && map.getLayer('corridor-3d')) {
      map.setPaintProperty('corridor-3d', 'fill-extrusion-color', ['case', ['get', 'c'], CULTURE, colour.tint]);
      map.setPaintProperty('corridor-roof', 'fill-extrusion-color', ['case', ['get', 'c'], CULTURE_TOP, colour.roof]);
    }
    setCity3d(map, false);
    reveal(map);
  });
}
