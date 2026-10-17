import type { ExpressionSpecification, GeoJSONSource, Map } from "maplibre-gl";
import type { Route } from "../api/contract";
import { BUILDING_SOURCE } from "./style";

/** Normalize tiled clusters into footprints so a full-route overview still has 3D. */
const SOURCE = "route-buildings";
const CORRIDOR_M = 220;
const EMPTY = { type: "FeatureCollection" as const, features: [] };
const PROPERTIES = [
  ["building-3d", "fill-extrusion-height"],
  ["building-3d", "fill-extrusion-base"],
  ["building-roof", "fill-extrusion-height"],
  ["building-roof", "fill-extrusion-base"],
] as const;
type Point = [number, number];
type Segment = [Point, Point];
interface FocusState {
  originals: globalThis.Map<string, ExpressionSpecification | number>;
  segments: Segment[] | null;
  dirty: boolean;
  scanning: boolean;
  generation: number;
  disposed: boolean;
  timer?: ReturnType<typeof setTimeout>;
}
const states = new WeakMap<Map, FocusState>();
const toMetres = ([lng, lat]: number[]): Point => [
  lng * 111320 * Math.cos((52.23 * Math.PI) / 180),
  lat * 110540,
];
function pointDistance(p: Point, [a, b]: Segment): number {
  const dx = b[0] - a[0],
    dy = b[1] - a[1];
  const t = Math.max(
    0,
    Math.min(
      1,
      ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / (dx * dx + dy * dy || 1),
    ),
  );
  return Math.hypot(p[0] - a[0] - t * dx, p[1] - a[1] - t * dy);
}
function cross(a: Point, b: Point, c: Point) {
  return (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
}
function nearCorridor(ring: number[][], segments: Segment[]): boolean {
  const points = ring.map(toMetres);
  const xs = points.map((p) => p[0]),
    ys = points.map((p) => p[1]);
  const minX = Math.min(...xs),
    maxX = Math.max(...xs),
    minY = Math.min(...ys),
    maxY = Math.max(...ys);
  for (const [a, b] of segments) {
    if (
      Math.max(a[0], b[0]) < minX - CORRIDOR_M ||
      Math.min(a[0], b[0]) > maxX + CORRIDOR_M ||
      Math.max(a[1], b[1]) < minY - CORRIDOR_M ||
      Math.min(a[1], b[1]) > maxY + CORRIDOR_M
    )
      continue;
    for (let i = 1; i < points.length; i++) {
      const c = points[i - 1],
        d = points[i];
      if (
        pointDistance(c, [a, b]) <= CORRIDOR_M ||
        pointDistance(a, [c, d]) <= CORRIDOR_M ||
        pointDistance(b, [c, d]) <= CORRIDOR_M
      )
        return true;
      if (
        Math.max(a[0], b[0]) >= Math.min(c[0], d[0]) &&
        Math.min(a[0], b[0]) <= Math.max(c[0], d[0]) &&
        Math.max(a[1], b[1]) >= Math.min(c[1], d[1]) &&
        Math.min(a[1], b[1]) <= Math.max(c[1], d[1]) &&
        cross(a, b, c) * cross(a, b, d) <= 0 &&
        cross(c, d, a) * cross(c, d, b) <= 0
      )
        return true;
    }
  }
  return false;
}
function scan(map: Map, state: FocusState): void {
  // Never cancel an in-progress slice from idle. Tile arrivals retain dirty for the next pass.
  if (
    state.disposed ||
    state.scanning ||
    !state.segments ||
    !state.dirty ||
    map.isMoving()
  )
    return;
  state.dirty = false;
  state.scanning = true;
  const generation = state.generation,
    segments = state.segments;
  const footprints = map
    .querySourceFeatures(BUILDING_SOURCE, { sourceLayer: "building" })
    .flatMap((feature) => {
      const geometry = feature.geometry;
      const polygons =
        geometry.type === "Polygon"
          ? [geometry.coordinates]
          : geometry.type === "MultiPolygon"
            ? geometry.coordinates
            : [];
      return polygons.map((coordinates: number[][][]) => ({
        coordinates,
        properties: feature.properties,
      }));
    });
  const selected: {
      type: "Feature";
      geometry: { type: "Polygon"; coordinates: number[][][] };
      properties: { height: number; base: number };
    }[] = [],
    seen = new Set<string>();
  let index = 0;
  const slice = () => {
    if (state.disposed || generation !== state.generation) return;
    const deadline = performance.now() + 6;
    while (index < footprints.length && performance.now() < deadline) {
      const { coordinates, properties } = footprints[index++];
      if (
        !coordinates[0]?.length ||
        properties.hide_3d === true ||
        !nearCorridor(coordinates[0], segments)
      )
        continue;
      // Tile feature IDs can cover hundreds of distinct buildings. Deduplicate exact geometry only.
      const key = JSON.stringify(coordinates);
      if (seen.has(key)) continue;
      seen.add(key);
      const height = Number(properties.render_height),
        base = Number(properties.render_min_height);
      selected.push({
        type: "Feature",
        geometry: { type: "Polygon", coordinates },
        properties: {
          height: Number.isFinite(height) && height > 0 ? height : 12,
          base: Number.isFinite(base) && base >= 0 ? base : 0,
        },
      });
    }
    if (index < footprints.length) state.timer = setTimeout(slice, 0);
    else {
      (map.getSource(SOURCE) as GeoJSONSource).setData({
        type: "FeatureCollection",
        features: selected,
      });
      state.scanning = false;
      if (state.dirty) state.timer = setTimeout(() => scan(map, state), 100);
    }
  };
  slice();
}
export function initRouteFocus(map: Map): void {
  const originals = new globalThis.Map<
    string,
    ExpressionSpecification | number
  >();
  for (const [layer, property] of PROPERTIES) {
    const value = map.getPaintProperty(layer, property) as
      | ExpressionSpecification
      | number
      | undefined;
    if (value !== undefined) originals.set(`${layer}|${property}`, value);
  }
  map.addSource(SOURCE, { type: "geojson", data: EMPTY });
  map.addLayer(
    {
      id: SOURCE,
      source: SOURCE,
      type: "fill-extrusion",
      minzoom: 12,
      paint: {
        "fill-extrusion-height": ["get", "height"],
        "fill-extrusion-base": ["get", "base"],
        "fill-extrusion-color": "#b8c8bd",
        "fill-extrusion-opacity": 1,
      },
    },
    "place-label",
  );
  const state: FocusState = {
    originals,
    segments: null,
    dirty: false,
    scanning: false,
    generation: 0,
    disposed: false,
  };
  states.set(map, state);
  if (import.meta.env.DEV) Object.assign(window, { routeFocusState: state });
  let soon: ReturnType<typeof setTimeout>;
  const schedule = () => {
    clearTimeout(soon);
    soon = setTimeout(() => scan(map, state), 250);
  };
  map.on("sourcedata", (event) => {
    if (event.sourceId === BUILDING_SOURCE && "tile" in event && event.tile) {
      state.dirty = true;
      schedule();
    }
  });
  map.on("moveend", () => {
    state.dirty = true;
    schedule();
  });
  map.on("idle", () => scan(map, state));
  map.once("remove", () => {
    state.disposed = true;
    state.generation++;
    clearTimeout(soon);
    clearTimeout(state.timer);
  });
}
export function focusRoute(map: Map, route: Route | undefined): void {
  const state = states.get(map);
  if (!state) return;
  clearTimeout(state.timer);
  state.generation++;
  state.scanning = false;
  state.dirty = true;
  const points = route?.geometry.coordinates.map(toMetres);
  state.segments = points
    ? points.slice(1).map((p, i) => [points[i], p])
    : null;
  (map.getSource(SOURCE) as GeoJSONSource).setData(EMPTY);
  for (const [layer, property] of PROPERTIES) {
    const original = state.originals.get(`${layer}|${property}`);
    if (original !== undefined)
      map.setPaintProperty(layer, property, route ? 0 : original);
  }
  scan(map, state);
}
