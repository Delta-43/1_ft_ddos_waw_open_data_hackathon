import type { ExpressionSpecification, StyleSpecification } from 'maplibre-gl';
import { TILES } from './config';

/**
 * Every colour used by the map. Tweak these to restyle the whole map;
 * the layer definitions below only reference the palette.
 */
export const palette = {
  background: '#0b1220',
  residential: '#0f1829',
  park: '#12242a',
  wood: '#10212a',
  water: '#0b2a33',
  waterway: '#12404a',
  roadMinor: '#1a2638',
  roadMajor: '#24344c',
  roadMotorway: '#2e4562',
  rail: '#22314a',
  buildingLow: '#121c2e',
  buildingHigh: '#1f2e48',
  buildingRoof: '#3a5a86',
  buildingRim: '#7fb4e6',
  // Near-white: MapLibre adds (1 - light colour) as ambient, so a saturated blue
  // light would tint shadowed walls red. The blue comes from the building colours.
  light: '#e8f0ff',
  label: '#8aa4c4',
  labelWater: '#4f8a96',
  labelHalo: '#0b1220',
  sky: '#060b16',
  horizon: '#1b3550',
  fog: '#0d1a2b',
};

export type Palette = typeof palette;

/**
 * How strongly each building shows its real OpenStreetMap colour (`colour` in the tiles:
 * `building:colour`, or a colour OpenMapTiles derives from `building:material`).
 * 0 = palette only, 1 = true colour. Buildings without colour data keep the palette.
 * The tiles carry no facade imagery, so colour is the only appearance data available.
 */
export const OSM_COLOUR_STRENGTH = 0.65;

/** Fallback for buildings whose tiles carry no height (metres). */
const FALLBACK_HEIGHT = 12;
/** Thickness of the lighter "roof cap" slab that gives buildings a rim highlight (metres). */
const ROOF_CAP = 0.6;
/**
 * Rim details (roof caps, footprint lines) cost a full extra pass over every building, so
 * they start at street level where few buildings are on screen (measured: −18% and −10%
 * frame time at zoom 15 without them).
 */
const DETAIL_MINZOOM = 16;

/** First zoom with 3D buildings; also used by buildingOutlines.ts. */
export const BUILDING_MINZOOM = 13;
/** Vector source id; also used by buildingOutlines.ts. */
export const BUILDING_SOURCE = 'openmaptiles';
/** Feature-state flag set by buildingOutlines.ts on outlines that would hide their parts. */
export const OUTLINE_STATE = 'unflaggedOutline';

const height: ExpressionSpecification = ['coalesce', ['get', 'render_height'], FALLBACK_HEIGHT];
const minHeight: ExpressionSpecification = ['coalesce', ['get', 'render_min_height'], 0];
const notHidden: ExpressionSpecification = ['!=', ['get', 'hide_3d'], true];
// Filters cannot read feature-state, so detected outlines are collapsed to zero height instead.
const isOutline: ExpressionSpecification = ['boolean', ['feature-state', OUTLINE_STATE], false];
const unlessOutline = (value: ExpressionSpecification | number): ExpressionSpecification => ['case', isOutline, 0, value];

/** Road width that grows with zoom: [zoom, width] stops. */
function roadWidth(stops: [number, number][]): ExpressionSpecification {
  return ['interpolate', ['exponential', 1.5], ['zoom'], ...stops.flat()] as ExpressionSpecification;
}

/** Builds the custom dark style from a palette (OpenMapTiles schema). */
export function buildStyle(p: Palette = palette): StyleSpecification {
  const source = BUILDING_SOURCE;
  // Taller buildings are slightly lighter in the palette, which helps the skyline read.
  // Stops are explicit colours: inside `to-color` below, bare strings would not interpolate.
  const paletteColour: ExpressionSpecification = [
    'interpolate', ['linear'], height,
    0, ['to-color', p.buildingLow],
    120, ['to-color', p.buildingHigh],
  ];
  // Real OSM colour where present (to-color falls back to the palette for missing or invalid
  // values), blended towards the palette so the night look holds.
  const buildingColour: ExpressionSpecification = [
    'interpolate-lab', ['linear'], OSM_COLOUR_STRENGTH,
    0, paletteColour,
    1, ['to-color', ['get', 'colour'], paletteColour],
  ];
  return {
    version: 8,
    name: 'Warsaw dark',
    glyphs: TILES.glyphs,
    sources: {
      [source]: { type: 'vector', url: TILES.tileJson },
    },
    // Directional light for extrusions: lit faces brighten, shadowed faces stay dark.
    light: { anchor: 'viewport', color: p.light, intensity: 0.3, position: [1.5, 210, 30] },
    // Sky and fog become visible when the camera is pitched towards the horizon.
    sky: {
      'sky-color': p.sky,
      'horizon-color': p.horizon,
      'fog-color': p.fog,
      'sky-horizon-blend': 0.6,
      'horizon-fog-blend': 0.6,
      'fog-ground-blend': 0.75,
      'atmosphere-blend': 0,
    },
    layers: [
      { id: 'background', type: 'background', paint: { 'background-color': p.background } },
      {
        id: 'landuse-residential',
        type: 'fill',
        source,
        'source-layer': 'landuse',
        filter: ['match', ['get', 'class'], ['residential', 'suburb', 'neighbourhood'], true, false],
        paint: { 'fill-color': p.residential },
      },
      {
        id: 'landcover-wood',
        type: 'fill',
        source,
        'source-layer': 'landcover',
        filter: ['==', ['get', 'class'], 'wood'],
        paint: { 'fill-color': p.wood },
      },
      {
        id: 'landcover-grass',
        type: 'fill',
        source,
        'source-layer': 'landcover',
        filter: ['==', ['get', 'class'], 'grass'],
        paint: { 'fill-color': p.park },
      },
      {
        id: 'park',
        type: 'fill',
        source,
        'source-layer': 'park',
        paint: { 'fill-color': p.park, 'fill-opacity': 0.9 },
      },
      {
        id: 'waterway',
        type: 'line',
        source,
        'source-layer': 'waterway',
        paint: { 'line-color': p.waterway, 'line-width': roadWidth([[10, 0.5], [18, 6]]) },
      },
      {
        id: 'water',
        type: 'fill',
        source,
        'source-layer': 'water',
        filter: ['!=', ['get', 'brunnel'], 'tunnel'],
        paint: { 'fill-color': p.water },
      },
      {
        id: 'road-minor',
        type: 'line',
        source,
        'source-layer': 'transportation',
        minzoom: 13,
        filter: ['match', ['get', 'class'], ['minor', 'service', 'track', 'path'], true, false],
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: { 'line-color': p.roadMinor, 'line-width': roadWidth([[13, 0.5], [18, 8]]) },
      },
      {
        id: 'rail',
        type: 'line',
        source,
        'source-layer': 'transportation',
        filter: ['match', ['get', 'class'], ['rail', 'transit'], true, false],
        paint: {
          'line-color': p.rail,
          'line-width': roadWidth([[12, 0.8], [18, 3]]),
          'line-dasharray': [2, 2],
        },
      },
      {
        id: 'road-major',
        type: 'line',
        source,
        'source-layer': 'transportation',
        filter: ['match', ['get', 'class'], ['primary', 'secondary', 'tertiary'], true, false],
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: { 'line-color': p.roadMajor, 'line-width': roadWidth([[10, 0.8], [18, 16]]) },
      },
      {
        id: 'road-motorway',
        type: 'line',
        source,
        'source-layer': 'transportation',
        filter: ['match', ['get', 'class'], ['motorway', 'trunk'], true, false],
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: { 'line-color': p.roadMotorway, 'line-width': roadWidth([[10, 1.2], [18, 20]]) },
      },
      {
        // Faint footprint outline: a light-blue rim where buildings meet the ground.
        id: 'building-outline',
        type: 'line',
        source,
        'source-layer': 'building',
        minzoom: DETAIL_MINZOOM,
        paint: { 'line-color': p.buildingRim, 'line-opacity': 0.25, 'line-width': 0.6 },
      },
      {
        id: 'building-3d',
        type: 'fill-extrusion',
        source,
        'source-layer': 'building',
        minzoom: BUILDING_MINZOOM,
        filter: notHidden,
        paint: {
          'fill-extrusion-color': buildingColour,
          'fill-extrusion-height': unlessOutline(height),
          'fill-extrusion-base': unlessOutline(minHeight),
          // Keep at 1: below 1 MapLibre draws every building twice (depth pass + colour pass),
          // measured at +26% frame time.
          'fill-extrusion-opacity': 1,
          'fill-extrusion-vertical-gradient': true,
        },
      },
      {
        // Thin lighter slab on top of each building: reads as a highlighted roof edge.
        id: 'building-roof',
        type: 'fill-extrusion',
        source,
        'source-layer': 'building',
        minzoom: DETAIL_MINZOOM,
        filter: notHidden,
        paint: {
          // The building's own colour, lifted towards the roof highlight.
          'fill-extrusion-color': ['interpolate-lab', ['linear'], 0.45, 0, buildingColour, 1, p.buildingRoof],
          'fill-extrusion-base': unlessOutline(height),
          'fill-extrusion-height': unlessOutline(['+', height, ROOF_CAP]),
          'fill-extrusion-opacity': 1,
        },
      },
      {
        id: 'water-label',
        type: 'symbol',
        source,
        'source-layer': 'water_name',
        layout: {
          'text-field': ['coalesce', ['get', 'name:pl'], ['get', 'name']],
          'text-font': TILES.font,
          'text-size': 13,
          'text-letter-spacing': 0.2,
        },
        paint: { 'text-color': p.labelWater, 'text-halo-color': p.labelHalo, 'text-halo-width': 1.2 },
      },
      {
        id: 'place-label',
        type: 'symbol',
        source,
        'source-layer': 'place',
        // No city label: the banner names Warsaw, and it would sit on the city-centre pins.
        filter: ['match', ['get', 'class'], ['suburb', 'quarter', 'neighbourhood'], true, false],
        layout: {
          'text-field': ['coalesce', ['get', 'name:pl'], ['get', 'name']],
          'text-font': TILES.font,
          'text-size': ['match', ['get', 'class'], 'suburb', 13, 11],
          'text-transform': 'uppercase',
          'text-letter-spacing': 0.15,
        },
        paint: { 'text-color': p.label, 'text-halo-color': p.labelHalo, 'text-halo-width': 1.2 },
      },
    ],
  };
}
