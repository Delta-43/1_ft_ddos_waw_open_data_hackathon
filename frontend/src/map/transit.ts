import { Popup, type GeoJSONSource, type Map, type MapLayerMouseEvent } from 'maplibre-gl';
import type { Route } from '../api/contract';
import { getLang } from '../i18n/language';
import { translate, type Key } from '../i18n/translations';
import { TILES } from './config';
import { palette } from './style';

const t = (key: Key, vars?: Record<string, string | number>) => translate(getLang(), key, vars);

/**
 * Public transport near the selected route, from the ZTM timetable (public/transit-cache.json,
 * built by scripts/build_transit_cache.py). Stops within reach of the route are small blue dots.
 * A letter (T for a tram, B for a bus) moves along each vehicle that is approaching one of them,
 * by its timetable: a scheduled position, not live GPS. Only trips heading towards the route's
 * destination or back towards its start are shown.
 */
const CACHE_URL = '/transit-cache.json';
const REACH_M = 250;
/** A trip counts as heading somewhere when its next stop is at least this much closer to it. */
const HEADING_M = 30;
const MAX_VEHICLES = 28;
const TICK_MS = 1000;
const TRAIL_S = [0, 8, 16, 24, 32];

type Mode = 'tram' | 'bus' | 'rail' | 'metro';
type Point = [number, number];
interface Cache {
  service_date: string;
  near: string[];
  stops: Record<string, [string, number, number, string]>;
  routes: Record<string, [string, Mode]>;
  paths: [number, number, number][][];
  /** route id, headsign, path index, stop ids, arrival seconds, distance along the path */
  trips: [string, string, number, string[], number[], number[]][];
}
interface Approach { trip: Cache['trips'][number]; stop: number; towards: 'destination' | 'start' }

const M_PER_DEG_LAT = 110_540;
const M_PER_DEG_LNG = 111_320 * Math.cos((52.22 * Math.PI) / 180);
const toMetres = ([lng, lat]: Point): Point => [lng * M_PER_DEG_LNG, lat * M_PER_DEG_LAT];

let cache: Promise<Cache | null> | undefined;
const loadCache = () => (cache ??= fetch(CACHE_URL).then(r => (r.ok ? (r.json() as Promise<Cache>) : null)).catch(() => null));

/** `?time=11:00` pins the clock (for rehearsals and recordings); otherwise Warsaw's time now. */
const pinnedTime = new URLSearchParams(window.location.search).get('time');
function secondsNow(): number {
  if (pinnedTime && /^\d{1,2}:\d{2}$/.test(pinnedTime)) {
    const [h, m] = pinnedTime.split(':').map(Number);
    return h * 3600 + m * 60 + ((Date.now() / 1000) % 60);
  }
  const parts = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Warsaw', hour: 'numeric', minute: 'numeric', second: 'numeric', hourCycle: 'h23' })
    .formatToParts(new Date());
  const get = (type: string) => Number(parts.find(part => part.type === type)?.value ?? 0);
  return get('hour') * 3600 + get('minute') * 60 + get('second');
}

function distanceToRoute(point: Point, segments: [Point, Point][]): number {
  const [x, y] = toMetres(point);
  let best = Infinity;
  for (const [[ax, ay], [bx, by]] of segments) {
    const dx = bx - ax;
    const dy = by - ay;
    const length = dx * dx + dy * dy;
    const t = length === 0 ? 0 : Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / length));
    best = Math.min(best, Math.hypot(x - (ax + t * dx), y - (ay + t * dy)));
  }
  return best;
}

const metresBetween = (a: Point, b: Point) => {
  const [p, q] = [toMetres(a), toMetres(b)];
  return Math.hypot(p[0] - q[0], p[1] - q[1]);
};

/** Whether a trip leaving stop `i` heads towards the route's destination, its start, or neither. */
function headingAt(data: Cache, ids: string[], i: number, start: Point, end: Point): Approach['towards'] | null {
  const where = (id: string): Point => [data.stops[id][1], data.stops[id][2]];
  const [here, next] = [where(ids[i]), where(ids[i + 1])];
  if (metresBetween(next, end) < metresBetween(here, end) - HEADING_M) return 'destination';
  if (metresBetween(next, start) < metresBetween(here, start) - HEADING_M) return 'start';
  return null;
}

/** The trips that approach a stop near the route while heading to its destination or its start. */
function approaches(data: Cache, route: Route): { stops: Set<string>; list: Approach[]; ends: [Point, Point] } {
  const coordinates = route.geometry.coordinates;
  const metres = coordinates.map(toMetres);
  const segments = metres.slice(1).map((p, i): [Point, Point] => [metres[i], p]);
  const start = coordinates[0];
  const end = coordinates[coordinates.length - 1];
  const reach = new Set(data.near.filter(id => data.stops[id] && distanceToRoute([data.stops[id][1], data.stops[id][2]], segments) <= REACH_M));
  const list: Approach[] = [];
  const stops = new Set<string>();
  for (const trip of data.trips) {
    const ids = trip[3];
    let first: Approach | undefined;
    for (let i = 0; i < ids.length - 1; i++) {
      if (!reach.has(ids[i])) continue;
      const towards = headingAt(data, ids, i, start, end);
      if (!towards) continue;
      stops.add(ids[i]);
      first ??= { trip, stop: i, towards };
    }
    // One moving dot per trip: towards its first stop near the route.
    if (first) list.push(first);
  }
  return { stops, list, ends: [start, end] };
}

/** Where a trip is at `now` by its timetable, interpolated along its line's shape. */
function positionAt(data: Cache, trip: Cache['trips'][number], now: number): Point | null {
  const [, , pathIndex, , times, dists] = trip;
  if (now < times[0] || now > times[times.length - 1]) return null;
  let k = 0;
  while (k < times.length - 2 && times[k + 1] < now) k++;
  const span = times[k + 1] - times[k];
  const along = dists[k] + (span > 0 ? (now - times[k]) / span : 0) * (dists[k + 1] - dists[k]);
  const path = data.paths[pathIndex];
  for (let i = 1; i < path.length; i++) {
    if (path[i][2] >= along) {
      const [a, b] = [path[i - 1], path[i]];
      const f = b[2] > a[2] ? (along - a[2]) / (b[2] - a[2]) : 0;
      return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f];
    }
  }
  const last = path[path.length - 1];
  return [last[0], last[1]];
}

const TRAM_COLOUR = '#ffcf5c';
const BUS_COLOUR = '#ff7a6b';
interface State { timer?: number; popup?: Popup; data?: Cache; current?: ReturnType<typeof approaches> }
const states = new WeakMap<Map, State>();
const empty = () => ({ type: 'FeatureCollection' as const, features: [] as unknown[] });

/** Call once after the style loads. */
export function initTransit(map: Map): void {
  void loadCache();
  states.set(map, {});
  for (const id of ['transit-stops', 'transit-vehicles', 'transit-trails']) map.addSource(id, { type: 'geojson', data: empty() as never });
  map.addLayer({ id: 'transit-trails', type: 'line', source: 'transit-trails', layout: { 'line-cap': 'round' },
    paint: { 'line-color': ['match', ['get', 'mode'], 'tram', TRAM_COLOUR, BUS_COLOUR], 'line-width': 3, 'line-opacity': 0.55, 'line-blur': 1.5 } });
  map.addLayer({ id: 'transit-stop-glow', type: 'circle', source: 'transit-stops',
    paint: { 'circle-color': '#5ac8fa', 'circle-radius': ['interpolate', ['linear'], ['zoom'], 13, 5, 17, 11], 'circle-opacity': 0.22, 'circle-blur': 1 } });
  map.addLayer({ id: 'transit-stops', type: 'circle', source: 'transit-stops',
    paint: {
      'circle-color': '#5ac8fa',
      'circle-radius': ['interpolate', ['linear'], ['zoom'], 13, 2.2, 17, 4.5],
      'circle-stroke-color': '#0b2a3a',
      'circle-stroke-width': 1,
    } });
  // Each vehicle is a plain letter, like a map label: T for a tram, B for a bus (M and R for the
  // odd metro or rail trip). Regular weight, a soft colour and a halo in the ground's own
  // colour, so it reads as a label rather than a game marker.
  map.addLayer({ id: 'transit-vehicles', type: 'symbol', source: 'transit-vehicles',
    layout: {
      'text-field': ['match', ['get', 'mode'], 'tram', 'T', 'metro', 'M', 'rail', 'R', 'B'],
      'text-font': TILES.font,
      'text-size': ['interpolate', ['linear'], ['zoom'], 13, 11, 17, 15],
      'text-allow-overlap': true,
      'text-ignore-placement': true,
    },
    paint: {
      'text-color': ['match', ['get', 'mode'], 'tram', '#ecd28f', '#f0a092'],
      'text-halo-color': palette.background,
      'text-halo-width': 1,
      'text-halo-blur': 0.5,
    } });
  map.on('click', 'transit-stops', event => openStop(map, event));
  map.on('mouseenter', 'transit-stops', () => { map.getCanvas().style.cursor = 'pointer'; });
  map.on('mouseleave', 'transit-stops', () => { map.getCanvas().style.cursor = ''; });
}

function minutes(seconds: number): string {
  const m = Math.round(seconds / 60);
  return m <= 0 ? t('transitNow') : t('transitMinutes', { n: m });
}

function openStop(map: Map, event: MapLayerMouseEvent): void {
  const state = states.get(map);
  const id = event.features?.[0]?.properties?.id as string | undefined;
  if (!state?.data || !state.current || !id) return;
  const data = state.data;
  const now = secondsNow();
  // Next departure per line and direction from this stop, soonest first.
  const next = new globalThis.Map<string, { line: string; mode: Mode; headsign: string; towards: string; in: number }>();
  const [start, end] = state.current.ends;
  for (const trip of data.trips) {
    const i = trip[3].indexOf(id);
    if (i < 0 || i === trip[3].length - 1 || trip[4][i] < now) continue;
    const towards = headingAt(data, trip[3], i, start, end);
    if (!towards) continue;
    const [line, mode] = data.routes[trip[0]] ?? [trip[0], 'bus'];
    const key = `${line}|${trip[1]}`;
    const wait = trip[4][i] - now;
    if (!next.has(key) || next.get(key)!.in > wait) next.set(key, { line, mode, headsign: trip[1], towards, in: wait });
  }
  const rows = [...next.values()].sort((a, b) => a.in - b.in).slice(0, 5);
  const root = document.createElement('div');
  root.className = 'transit-popup__body';
  const title = document.createElement('p');
  title.className = 'transit-popup__title';
  title.textContent = data.stops[id][0] + (data.stops[id][3] ? ` ${data.stops[id][3]}` : '');
  root.append(title);
  const list = document.createElement('ul');
  for (const row of rows) {
    const item = document.createElement('li');
    item.innerHTML = '<span class="transit-popup__line"></span><span class="transit-popup__to"></span><span class="transit-popup__in"></span>';
    const [lineEl, toEl, inEl] = item.children as unknown as HTMLElement[];
    lineEl.textContent = row.line;
    lineEl.dataset.mode = row.mode;
    toEl.textContent = row.headsign;
    const towards = document.createElement('small');
    towards.textContent = row.towards === 'destination' ? t('transitTowardsDestination') : t('transitTowardsStart');
    toEl.append(towards);
    inEl.textContent = minutes(row.in);
    list.append(item);
  }
  if (rows.length === 0) {
    const item = document.createElement('li');
    item.textContent = t('transitNoDepartures');
    list.append(item);
  }
  root.append(list);
  const note = document.createElement('p');
  note.className = 'transit-popup__note';
  note.textContent = t('transitNote', { date: data.service_date, at: pinnedTime ? t('transitShownAt', { time: pinnedTime }) : '' });
  root.append(note);
  state.popup?.remove();
  state.popup = new Popup({ offset: 10, className: 'transit-popup', maxWidth: '18rem' }).setLngLat([data.stops[id][1], data.stops[id][2]]).setDOMContent(root).addTo(map);
}

function draw(map: Map, state: State): void {
  const { data, current } = state;
  if (!data || !current) return;
  const now = secondsNow();
  const modeOf = (trip: Cache['trips'][number]) => data.routes[trip[0]]?.[1] ?? 'bus';
  // Approaching vehicles only (between the start of the stored stretch and the stop), nearest first.
  const approaching = current.list
    .filter(({ trip, stop }) => trip[4][0] <= now && now <= trip[4][stop])
    .sort((a, b) => a.trip[4][a.stop] - b.trip[4][b.stop])
    .slice(0, MAX_VEHICLES);
  const vehicles: unknown[] = [];
  const trails: unknown[] = [];
  for (const { trip } of approaching) {
    const here = positionAt(data, trip, now);
    if (!here) continue;
    const mode = modeOf(trip);
    vehicles.push({ type: 'Feature', properties: { mode }, geometry: { type: 'Point', coordinates: here } });
    const tail = TRAIL_S.map(back => positionAt(data, trip, now - back)).filter((p): p is Point => p !== null);
    if (tail.length > 1) trails.push({ type: 'Feature', properties: { mode }, geometry: { type: 'LineString', coordinates: tail } });
  }
  (map.getSource('transit-vehicles') as GeoJSONSource | undefined)?.setData({ type: 'FeatureCollection', features: vehicles } as never);
  (map.getSource('transit-trails') as GeoJSONSource | undefined)?.setData({ type: 'FeatureCollection', features: trails } as never);
}

let request = 0;

/** Shows transit for `route`, or clears it when undefined. */
export function showTransit(map: Map, route: Route | undefined): void {
  const state = states.get(map);
  if (!state) return;
  const ticket = ++request;
  window.clearInterval(state.timer);
  state.popup?.remove();
  state.current = undefined;
  const clear = () => {
    for (const id of ['transit-stops', 'transit-vehicles', 'transit-trails']) (map.getSource(id) as GeoJSONSource | undefined)?.setData(empty() as never);
  };
  clear();
  if (!route) return;
  void loadCache().then(data => {
    if (!data || ticket !== request) return;
    state.data = data;
    state.current = approaches(data, route);
    const stops = [...state.current.stops].map(id => ({
      type: 'Feature', properties: { id, name: data.stops[id][0] }, geometry: { type: 'Point', coordinates: [data.stops[id][1], data.stops[id][2]] },
    }));
    (map.getSource('transit-stops') as GeoJSONSource).setData({ type: 'FeatureCollection', features: stops } as never);
    draw(map, state);
    state.timer = window.setInterval(() => draw(map, state), TICK_MS);
    map.once('remove', () => window.clearInterval(state.timer));
  });
}
