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

/** A city WMS render that has not arrived by then counts as unavailable (the pitch must not wait). */
export const LOAD_TIMEOUT_MS = 8000;

function removeLayer(map: Map, layer: HistoricalLayer): void {
  if (map.getLayer(layerId(layer))) map.removeLayer(layerId(layer));
  if (map.getSource(sourceId(layer))) map.removeSource(sourceId(layer));
}

/**
 * Shows exactly one historical layer (or none, for `layerIndex === -1`),
 * hiding the others. Call only after the style has loaded.
 *
 * A layer's image source is added the first time that year is shown, not at
 * startup: a pending image source keeps the map from ever going `idle`, and
 * pins and route layers wait for `idle`, so a slow or stuck WMS would hide
 * them while the overlay is not even on (reproduced with a WMS that never
 * answers). If the image has not loaded within LOAD_TIMEOUT_MS, the layer is
 * removed again and `onUnavailable` is called with its id.
 *
 * The layer is stacked on top of the whole style (no `beforeId`) rather than
 * tucked under the ground: the game-map style's land/park/water fills are fully
 * opaque, so a layer placed underneath them is invisible; on top, at partial
 * opacity, the historical photo reads as a translucent "ghost" over the
 * modern 3D city, which doubles as a then-and-now effect.
 */
export function showHistoricalLayer(map: Map, layerIndex: number, onUnavailable: (id: string) => void): void {
  HISTORICAL_LAYERS.forEach((layer, index) => {
    if (index !== layerIndex) {
      if (map.getLayer(layerId(layer))) map.setLayoutProperty(layerId(layer), 'visibility', 'none');
      return;
    }
    if (!map.getSource(sourceId(layer))) {
      map.addSource(sourceId(layer), { type: 'image', url: layer.image_url, coordinates: corners(layer) });
      map.addLayer({ id: layerId(layer), type: 'raster', source: sourceId(layer), paint: { 'raster-opacity': 0.75 } });
      window.setTimeout(() => {
        if (!map.getSource(sourceId(layer)) || map.isSourceLoaded(sourceId(layer))) return;
        removeLayer(map, layer);
        onUnavailable(layer.id);
      }, LOAD_TIMEOUT_MS);
    }
    map.setLayoutProperty(layerId(layer), 'visibility', 'visible');
  });
}

/** Drops a layer whose image failed, so it no longer counts as loading. */
export function removeHistoricalLayer(map: Map, id: string): void {
  const layer = HISTORICAL_LAYERS.find(candidate => candidate.id === id);
  if (layer) removeLayer(map, layer);
}
