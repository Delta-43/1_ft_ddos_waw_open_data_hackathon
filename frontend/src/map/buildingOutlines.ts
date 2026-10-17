import type { GeoJSONFeature, Map } from 'maplibre-gl';
import { BUILDING_SOURCE, OUTLINE_STATE } from './style';

/**
 * Hides building outlines that the tiles forgot to flag.
 *
 * In OpenStreetMap, detailed buildings are drawn as `building:part` shapes (podium, tower
 * tiers, spire) plus one outline carrying the total height. Renderers must skip the outline
 * when parts exist, or it becomes a solid block hiding the parts. OpenMapTiles marks such
 * outlines with `hide_3d`, but misses many (e.g. multipolygon outlines): the Palace of
 * Culture, Varso, Warsaw Spire and Złota 44 all arrive as full-height boxes.
 *
 * Detection (per loaded tile piece): a ground-based building is an unflagged outline when
 * other buildings sit inside it, the tallest reaches the outline's height, none is taller,
 * and ground-level parts cover most of its footprint (so hiding it leaves no hole). Matching
 * outlines get feature-state `{ [OUTLINE_STATE]: true }`, which the building layers collapse
 * to zero height. When unsure, the outline stays: a solid block beats a missing building.
 */

const TOLERANCE_M = 1;
/** Share of the outline's footprint that ground-level parts must cover (landmarks: 0.91–1.0). */
const MIN_GROUND_COVER = 0.8;
/** Grid cell size (degrees) for the centroid index; roughly 140 × 220 m in Warsaw. */
const CELL = 0.002;

type Ring = number[][];
type Box = [number, number, number, number];
interface Item {
  id: string | number;
  min: number;
  height: number;
  polygons: Ring[][];
  /** Bounding box of each polygon; multipolygon relations can hold 150+ scattered blocks. */
  boxes: Box[];
  bbox: Box;
  point: [number, number];
  /** Footprint area in square degrees; only ratios are used. */
  area: number;
}

/** Shoelace area of polygons with holes. */
function areaOf(polygons: Ring[][]): number {
  let total = 0;
  for (const rings of polygons) {
    rings.forEach((ring, index) => {
      let doubled = 0;
      for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
        doubled += (ring[j][0] + ring[i][0]) * (ring[j][1] - ring[i][1]);
      }
      total += (index === 0 ? 1 : -1) * Math.abs(doubled / 2);
    });
  }
  return total;
}

function toItem(feature: GeoJSONFeature): Item | undefined {
  const { geometry, properties, id } = feature;
  if (id === undefined || properties.hide_3d) return;
  const polygons: Ring[][] =
    geometry.type === 'Polygon' ? [geometry.coordinates] : geometry.type === 'MultiPolygon' ? geometry.coordinates : [];
  if (!polygons.length) return;
  const boxes = polygons.map(rings => {
    const box: Box = [Infinity, Infinity, -Infinity, -Infinity];
    for (const [x, y] of rings[0]) {
      box[0] = Math.min(box[0], x); box[1] = Math.min(box[1], y);
      box[2] = Math.max(box[2], x); box[3] = Math.max(box[3], y);
    }
    return box;
  });
  const minX = Math.min(...boxes.map(b => b[0]));
  const minY = Math.min(...boxes.map(b => b[1]));
  const maxX = Math.max(...boxes.map(b => b[2]));
  const maxY = Math.max(...boxes.map(b => b[3]));
  // Vertex average of the first outer ring: a cheap representative point for the part.
  const outer = polygons[0][0];
  const point: [number, number] = [0, 0];
  for (const [x, y] of outer) {
    point[0] += x / outer.length;
    point[1] += y / outer.length;
  }
  return {
    id,
    min: Number(properties.render_min_height ?? 0),
    height: Number(properties.render_height ?? 0),
    polygons,
    boxes,
    bbox: [minX, minY, maxX, maxY],
    point,
    area: areaOf(polygons),
  };
}

/** Even-odd point-in-polygon including holes, so courtyards are excluded. */
function contains({ polygons, boxes }: Item, [x, y]: [number, number]): boolean {
  return polygons.some((rings, index) => {
    const [minX, minY, maxX, maxY] = boxes[index];
    if (x < minX || x > maxX || y < minY || y > maxY) return false;
    let inside = false;
    for (const ring of rings) {
      for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
        const [xi, yi] = ring[i];
        const [xj, yj] = ring[j];
        if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
      }
    }
    return inside;
  });
}

const cellKey = (x: number, y: number) => `${Math.floor(x / CELL)}:${Math.floor(y / CELL)}`;

export interface OutlineEvidence {
  height: number;
  /** Footprint area (square degrees), from its largest tile piece. */
  area: number;
  /** Summed footprint of the distinct ground-level buildings inside it. */
  covered: number;
  /** Height of the tallest building inside it. */
  tallest: number;
}

/** Per ground-based building: what sits inside it, among the loaded features. */
export function collectOutlineEvidence(features: GeoJSONFeature[]): globalThis.Map<string | number, OutlineEvidence> {
  const items = features.map(toItem).filter((item): item is Item => !!item);
  const grid = new globalThis.Map<string, Item[]>();
  for (const item of items) {
    const key = cellKey(...item.point);
    const cell = grid.get(key);
    if (cell) cell.push(item);
    else grid.set(key, [item]);
  }

  // The same building arrives as several clipped pieces (neighbouring, parent and overzoomed
  // tiles). Each building's area is taken from its largest piece, and each part is counted
  // once per outline, so duplicates neither inflate coverage nor let one edge sliver decide.
  const fullArea = new globalThis.Map<string | number, number>();
  for (const item of items) fullArea.set(item.id, Math.max(fullArea.get(item.id) ?? 0, item.area));

  const groundParts = new globalThis.Map<string | number, Set<string | number>>();
  const evidence = new globalThis.Map<string | number, OutlineEvidence>();
  for (const outline of items) {
    if (outline.min !== 0) continue;
    const [minX, minY, maxX, maxY] = outline.bbox;
    const entry = evidence.get(outline.id) ?? { height: outline.height, area: fullArea.get(outline.id)!, covered: 0, tallest: 0 };
    const ground = groundParts.get(outline.id) ?? new Set();
    for (let gx = Math.floor(minX / CELL); gx <= Math.floor(maxX / CELL); gx++) {
      for (let gy = Math.floor(minY / CELL); gy <= Math.floor(maxY / CELL); gy++) {
        for (const other of grid.get(`${gx}:${gy}`) ?? []) {
          const [x, y] = other.point;
          if (other.id === outline.id || x < minX || x > maxX || y < minY || y > maxY) continue;
          // A real part fits inside its outline; a bigger "part" means we only see a sliver.
          if (fullArea.get(other.id)! > entry.area * 1.05) continue;
          if (!contains(outline, other.point)) continue;
          entry.tallest = Math.max(entry.tallest, other.height);
          if (other.min === 0) ground.add(other.id);
        }
      }
    }
    evidence.set(outline.id, entry);
    groundParts.set(outline.id, ground);
  }
  for (const [id, entry] of evidence) {
    for (const part of groundParts.get(id)!) entry.covered += fullArea.get(part)!;
  }
  return evidence;
}

/** Returns ids of unflagged outlines among the currently loaded building features. */
export function findUnflaggedOutlines(features: GeoJSONFeature[]): Set<string | number> {
  const outlines = new Set<string | number>();
  for (const [id, { height, area, covered, tallest }] of collectOutlineEvidence(features)) {
    const reachesTop = Math.abs(tallest - height) <= TOLERANCE_M;
    if (reachesTop && covered >= MIN_GROUND_COVER * area) outlines.add(id);
  }
  return outlines;
}

/** Re-checks loaded building tiles whenever new ones arrive (debounced to `idle`). */
export function hideUnflaggedOutlines(map: Map): void {
  const hidden = new Set<string | number>();
  let dirty = true;
  map.on('sourcedata', event => {
    if (event.sourceId === BUILDING_SOURCE && 'tile' in event && event.tile) dirty = true;
  });
  map.on('idle', () => {
    if (!dirty || !map.getSource(BUILDING_SOURCE)) return;
    dirty = false;
    const features = map.querySourceFeatures(BUILDING_SOURCE, { sourceLayer: 'building' });
    for (const id of findUnflaggedOutlines(features)) {
      if (hidden.has(id)) continue;
      hidden.add(id);
      map.setFeatureState({ source: BUILDING_SOURCE, sourceLayer: 'building', id }, { [OUTLINE_STATE]: true });
    }
  });
}
