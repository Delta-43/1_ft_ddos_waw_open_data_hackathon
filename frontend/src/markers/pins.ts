import { Popup, type GeoJSONSource, type Map, type MapLayerMouseEvent } from 'maplibre-gl';
import { TILES } from '../map/config';
import { iconId, registerPinIcons } from './icons';
import type { Pin, PinCategory } from './types';

const SOURCE_ID = 'pins';
const LAYER_ID = 'pins';

const CATEGORY_LABEL: Record<PinCategory, string> = {
  landmark: 'Landmark',
  museum: 'Museum',
  park: 'Park',
  generic: 'Place',
  air: 'Air quality station',
  aed: 'Defibrillator (AED)',
  toilet: 'Public toilet',
  event: 'Cultural event',
};

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

/** Escapes text for MapLibre's attribution (rendered as HTML) and links bare URLs. */
function attributionHtml(credits: Iterable<string>): string {
  const escape = (value: string) =>
    value.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
  return Array.from(credits, credit =>
    escape(credit).replace(/https?:\/\/[^\s,)]+/g, url => `<a href="${url}" target="_blank" rel="noopener">${url.replace(/^https?:\/\//, '').replace(/\/$/, '')}</a>`),
  ).join(' · ');
}

/** Source credits currently shown for each map's pins. */
const credits = new WeakMap<Map, Set<string>>();

/** Runs `fn` now if the style is ready, otherwise once the map has settled. */
function whenStyleReady(map: Map, fn: () => void) {
  if (map.isStyleLoaded()) fn();
  else map.once('idle', fn);
}

/**
 * Creates the source and symbol layer. MapLibre only reads a source's attribution when the
 * source is added, so new source credits rebuild both (cheap: one GeoJSON source).
 */
function ensureLayer(map: Map, attribution: string) {
  const existing = map.getSource(SOURCE_ID);
  if (existing && existing.attribution === attribution) return;
  if (existing) {
    map.removeLayer(LAYER_ID);
    map.removeSource(SOURCE_ID);
  }
  registerPinIcons(map);
  map.addSource(SOURCE_ID, { type: 'geojson', data: toGeoJSON([]), attribution });
  map.addLayer(
    {
      id: LAYER_ID,
      type: 'symbol',
      source: SOURCE_ID,
      layout: {
        'icon-image': ['get', 'icon'],
        'icon-allow-overlap': true,
        // Smaller pins when zoomed out, so dense areas (e.g. the Łazienki places) don't pile up.
        'icon-size': ['interpolate', ['linear'], ['zoom'], 10, 0.6, 14, 1],
        // Titles appear from street level; the icon always wins over its label.
        'text-field': ['step', ['zoom'], '', 14, ['get', 'title']],
        'text-font': TILES.font,
        'text-size': 12,
        'text-offset': [0, 1.7],
        'text-anchor': 'top',
        'text-optional': true,
      },
      paint: {
        'text-color': '#1d2b3a',
        'text-halo-color': '#ffffff',
        'text-halo-width': 1.4,
      },
    },
    // Below any route layers (ids `route-*`), so route lines and numbered stops stay on top
    // even when this layer is re-added after them.
    map.getLayersOrder().find(id => id.startsWith('route-')),
  );

  if (!existing) registerHandlers(map);
}

/** Click and hover handlers, once per map (they are bound to the layer id, not the layer). */
function registerHandlers(map: Map) {
  map.on('click', LAYER_ID, (event: MapLayerMouseEvent) => {
    // A route stop drawn on top of this pin owns the click (it opens the place-card pop-up).
    if (map.getLayer('route-stop') && map.queryRenderedFeatures(event.point, { layers: ['route-stop'] }).length > 0) return;
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
  category.textContent = CATEGORY_LABEL[pin.category];
  const title = document.createElement('h3');
  title.className = 'pin-popup__title';
  title.textContent = pin.title;
  root.append(category, title);

  if (pin.badge) {
    const badge = document.createElement('div');
    badge.className = 'pin-popup__badge';
    badge.textContent = pin.badge;
    root.append(badge);
  }

  const rows = Object.entries(pin.properties);
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
  const mapCredits = credits.get(map) ?? new Set<string>();
  credits.set(map, mapCredits);
  for (const pin of pins) {
    store.set(pin.id, pin);
    if (pin.attribution) mapCredits.add(pin.attribution);
  }
  whenStyleReady(map, () => {
    ensureLayer(map, attributionHtml(mapCredits));
    map.getSource<GeoJSONSource>(SOURCE_ID)?.setData(toGeoJSON(store.values()));
  });
}

/** Removes every pin from the map. */
export function clearPins(map: Map): void {
  storeFor(map).clear();
  credits.get(map)?.clear();
  map.getSource<GeoJSONSource>(SOURCE_ID)?.setData(toGeoJSON([]));
}
