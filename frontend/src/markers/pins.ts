import { Popup, type GeoJSONSource, type Map, type MapLayerMouseEvent } from 'maplibre-gl';
import { TILES } from '../map/config';
import { iconId, registerPinIcons } from './icons';
import type { Pin } from './types';

const SOURCE_ID = 'pins';
const LAYER_ID = 'pins';

/**
 * Pins currently shown, per map, keyed by pin id. The GeoJSON source is rebuilt
 * from this store, and popups read the original Pin from it.
 */
const stores = new WeakMap<Map, globalThis.Map<string, Pin>>();

function storeFor(map: Map) {
  let store = stores.get(map);
  if (!store) stores.set(map, (store = new globalThis.Map()));
  return store;
}

function toGeoJSON(pins: Iterable<Pin>) {
  return {
    type: 'FeatureCollection' as const,
    features: Array.from(pins, pin => ({
      type: 'Feature' as const,
      geometry: { type: 'Point' as const, coordinates: [pin.lng, pin.lat] },
      // Only what the layer needs for styling; the full Pin stays in the store.
      properties: { id: pin.id, title: pin.title, icon: iconId(pin.category) },
    })),
  };
}

/** Runs `fn` now if the style is ready, otherwise once the map has settled. */
function whenStyleReady(map: Map, fn: () => void) {
  if (map.isStyleLoaded()) fn();
  else map.once('idle', fn);
}

/** Creates the source, symbol layer and click/hover handlers once per map. */
function ensureLayer(map: Map) {
  if (map.getSource(SOURCE_ID)) return;
  registerPinIcons(map);
  map.addSource(SOURCE_ID, { type: 'geojson', data: toGeoJSON([]) });
  map.addLayer({
    id: LAYER_ID,
    type: 'symbol',
    source: SOURCE_ID,
    layout: {
      'icon-image': ['get', 'icon'],
      'icon-allow-overlap': true,
      // Titles appear from street level; the icon always wins over its label.
      'text-field': ['step', ['zoom'], '', 14, ['get', 'title']],
      'text-font': TILES.font,
      'text-size': 12,
      'text-offset': [0, 1.7],
      'text-anchor': 'top',
      'text-optional': true,
    },
    paint: {
      'text-color': '#dce8f5',
      'text-halo-color': '#0b1220',
      'text-halo-width': 1.4,
    },
  });

  map.on('click', LAYER_ID, (event: MapLayerMouseEvent) => {
    const feature = event.features?.[0];
    const pin = feature && storeFor(map).get(String(feature.properties.id));
    if (!pin) return;
    new Popup({ className: 'pin-popup', offset: 18, maxWidth: '280px' })
      .setLngLat([pin.lng, pin.lat])
      .setDOMContent(popupContent(pin))
      .addTo(map);
  });
  map.on('mouseenter', LAYER_ID, () => (map.getCanvas().style.cursor = 'pointer'));
  map.on('mouseleave', LAYER_ID, () => (map.getCanvas().style.cursor = ''));
}

/** Popup body built with textContent only, so data can never inject HTML. */
function popupContent(pin: Pin): HTMLElement {
  const root = document.createElement('div');
  const category = document.createElement('div');
  category.className = 'pin-popup__category';
  category.textContent = pin.category;
  const title = document.createElement('h3');
  title.className = 'pin-popup__title';
  title.textContent = pin.title;
  root.append(category, title);

  if (pin.properties.source === 'placeholder') {
    const badge = document.createElement('div');
    badge.className = 'pin-popup__badge';
    badge.textContent = 'Placeholder data';
    root.append(badge);
  }

  const rows = Object.entries(pin.properties).filter(([key]) => key !== 'source');
  if (rows.length) {
    const list = document.createElement('dl');
    for (const [key, value] of rows) {
      const dt = document.createElement('dt');
      dt.textContent = key;
      const dd = document.createElement('dd');
      dd.textContent = String(value);
      list.append(dt, dd);
    }
    root.append(list);
  }
  return root;
}

/**
 * Adds pins to the map, replacing any existing pin with the same id. All pins share
 * one GeoJSON source and one GPU-rendered symbol layer, so thousands stay fast
 * (no DOM markers). Safe to call before the style has finished loading.
 */
export function addPins(map: Map, pins: Pin[]): void {
  const store = storeFor(map);
  for (const pin of pins) store.set(pin.id, pin);
  whenStyleReady(map, () => {
    ensureLayer(map);
    map.getSource<GeoJSONSource>(SOURCE_ID)?.setData(toGeoJSON(store.values()));
  });
}

/** Removes every pin from the map. */
export function clearPins(map: Map): void {
  storeFor(map).clear();
  map.getSource<GeoJSONSource>(SOURCE_ID)?.setData(toGeoJSON([]));
}
