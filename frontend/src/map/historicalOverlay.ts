import type { Map } from 'maplibre-gl';
// Mirrors data/fixtures/historical-layers.json (the backend-generated source of
// truth - regenerate both with `python -m app.data.historical_layers`).
import historicalLayers from '../data/historicalLayers.json';

export interface HistoricalLayer {
  id: string;
  title: string;
  year: number;
  image_url: string;
  bounds: [[number, number], [number, number]];
  source_id: string;
}

/** The three verified historical overlays (1935/1939/1945) from the city's own WMS.
 * See data/fixtures/historical-layers.json and docs/DATA.md for provenance; the
 * image is a single bounded render, not a tiled basemap (that service has no
 * queryable attributes - GetFeatureInfo was tested and returns nothing). */
export const HISTORICAL_LAYERS: HistoricalLayer[] = historicalLayers.layers as HistoricalLayer[];

/** Required on screen whenever an overlay is active (not just in API responses) -
 * fee-exempt reuse under Polish PSI law requires crediting the source and the
 * data's creation date; see docs/DATA.md. */
export function attributionText(layer: HistoricalLayer): string {
  return `Historical overlay · Warsaw ${layer.year} · © Urząd m.st. Warszawy (architektura.um.warszawa.pl)`;
}

const SOURCE_PREFIX = 'historical-';
const LAYER_PREFIX = 'historical-layer-';

function sourceId(layer: HistoricalLayer): string {
  return `${SOURCE_PREFIX}${layer.id}`;
}

function layerId(layer: HistoricalLayer): string {
  return `${LAYER_PREFIX}${layer.id}`;
}

/** Image-source corners in MapLibre's clockwise order: top-left, top-right,
 * bottom-right, bottom-left. `bounds` is [[minLon, minLat], [maxLon, maxLat]]. */
function corners(layer: HistoricalLayer): [[number, number], [number, number], [number, number], [number, number]] {
  const [[minLon, minLat], [maxLon, maxLat]] = layer.bounds;
  return [
    [minLon, maxLat],
    [maxLon, maxLat],
    [maxLon, minLat],
    [minLon, minLat],
  ];
}

/**
 * Registers one historical overlay as an image layer, above the whole basemap
 * rather than tucked under the ground. The game-map style's land/park/water
 * fills are fully opaque, so a layer placed underneath them - the more
 * "natural" choice - is invisible; above them, at partial opacity, the
 * historical photo reads as a translucent "ghost" over the modern 3D city,
 * which doubles as a then-and-now effect. It still goes below the city pins
 * and route layers, so those stay readable on top of it.
 *
 * Added lazily, on first selection: an image source starts downloading as
 * soon as it is added, and until it finishes MapLibre reports the style as
 * not loaded and never fires `idle`. Adding all three WMS images at startup
 * let a slow city WMS stall everything that waits on those signals (routes,
 * pins, the intro).
 */
function ensureHistoricalLayer(map: Map, layer: HistoricalLayer): void {
  if (map.getSource(sourceId(layer))) return; // already added (or StrictMode double-mount)
  map.addSource(sourceId(layer), { type: 'image', url: layer.image_url, coordinates: corners(layer) });
  const beforeId = map.getLayersOrder().find(id => id === 'pins' || id.startsWith('route-'));
  map.addLayer(
    { id: layerId(layer), type: 'raster', source: sourceId(layer), paint: { 'raster-opacity': 0.75 }, layout: { visibility: 'none' } },
    beforeId,
  );
}

/** Shows exactly one historical layer (or none, for `layerIndex === -1`),
 * hiding the others. Call only after the style has loaded. */
export function showHistoricalLayer(map: Map, layerIndex: number): void {
  const selected = HISTORICAL_LAYERS[layerIndex];
  if (selected) ensureHistoricalLayer(map, selected);
  HISTORICAL_LAYERS.forEach((layer, index) => {
    if (!map.getLayer(layerId(layer))) return;
    map.setLayoutProperty(layerId(layer), 'visibility', index === layerIndex ? 'visible' : 'none');
  });
}
