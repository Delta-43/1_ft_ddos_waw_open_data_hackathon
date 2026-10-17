import type { ExpressionSpecification, StyleSpecification } from 'maplibre-gl';
import { TILES } from './config';

/**
 * Every colour used by the map: a bright, game-map palette. The ground follows the GTA V
 * map (cyan water, soft green parks, light urban ground, white roads, district outlines);
 * the 3D buildings follow the Assassin's Creed Unity map (pale steel-blue walls, light roofs).
 * Tweak these to restyle the whole map; the layers below only reference the palette.
 */
export const palette = {
  background: '#e4e9ee',
  residential: '#dde3e9',
  park: '#b5d893',
  wood: '#9cc879',
  water: '#4fc3e6',
  waterway: '#62cbea',
  roadCasing: '#b9c4cf',
  roadMinor: '#f7f9fb',
  roadMajor: '#ffffff',
  roadMotorway: '#ffffff',
  rail: '#a9b4bf',
  district: '#2f5d3a',
  neighbourhood: '#6f8f78',
  buildingLow: '#8ea6c0',
  buildingHigh: '#adc1d6',
  // Light, not white: a near-white roof slab glares against the bright ground.
  buildingRoof: '#d6e1ec',
  buildingRim: '#5f8fc0',
  // Near-white: MapLibre adds (1 - light colour) as ambient, so a saturated light would
  // tint shadowed walls with its complement. The blue comes from the building colours.
  light: '#ffffff',
  label: '#1d2b3a',
  labelWater: '#0d5f7a',
  labelHalo: '#ffffff',
  sky: '#9fd6f2',
  horizon: '#e8f4fa',
  fog: '#e3ecf2',
};

type Palette = typeof palette;

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
  // Untextured: every building uses the palette only. Taller buildings are slightly lighter,
  // which helps the skyline read.
  const buildingColour: ExpressionSpecification = ['interpolate', ['linear'], height, 0, p.buildingLow, 120, p.buildingHigh];
  return {
    version: 8,
    name: 'Warsaw bright game map',
    glyphs: TILES.glyphs,
    sources: {
      [source]: { type: 'vector', url: TILES.tileJson },
    },
    // Lit faces get up to 1.0 × colour, faces turned away (1 − intensity). A lower sun (55° from
    // vertical instead of 35°) keeps roofs from catching full light and shows more light/shade
    // contrast on walls; intensity 0.5 darkens the shaded sides.
    light: { anchor: 'viewport', color: p.light, intensity: 0.5, position: [1.5, 210, 55] },
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
        // White roads with a grey casing, as on the GTA V map (casing only for main roads).
        id: 'road-casing',
        type: 'line',
        source,
        'source-layer': 'transportation',
        filter: ['match', ['get', 'class'], ['motorway', 'trunk', 'primary', 'secondary', 'tertiary'], true, false],
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: {
          'line-color': p.roadCasing,
          // Zoom curve outside, class inside: only one zoom expression is allowed per property.
          'line-width': [
            'interpolate', ['exponential', 1.5], ['zoom'],
            10, ['match', ['get', 'class'], ['motorway', 'trunk'], 2.4, 1.6],
            18, ['match', ['get', 'class'], ['motorway', 'trunk'], 24, 19],
          ],
        },
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
        // Blue footprint rim where buildings meet the street.
        id: 'building-outline',
        type: 'line',
        source,
        'source-layer': 'building',
        minzoom: DETAIL_MINZOOM,
        paint: { 'line-color': p.buildingRim, 'line-opacity': 0.45, 'line-width': 0.8 },
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
          'fill-extrusion-color': p.buildingRoof,
          'fill-extrusion-base': unlessOutline(height),
          'fill-extrusion-height': unlessOutline(['+', height, ROOF_CAP]),
          'fill-extrusion-opacity': 1,
        },
      },
      {
        // Neighbourhood (osiedle) outlines, dashed, at street level.
        id: 'boundary-neighbourhood',
        type: 'line',
        source,
        'source-layer': 'boundary',
        minzoom: 14,
        filter: ['==', ['get', 'admin_level'], 10],
        paint: { 'line-color': p.neighbourhood, 'line-width': 1, 'line-opacity': 0.7, 'line-dasharray': [3, 2] },
      },
      {
        // District (dzielnica) outlines, like the GTA V neighbourhood map.
        id: 'boundary-district',
        type: 'line',
        source,
        'source-layer': 'boundary',
        filter: ['==', ['get', 'admin_level'], 9],
        layout: { 'line-join': 'round' },
        paint: { 'line-color': p.district, 'line-width': roadWidth([[11, 1.2], [16, 2.5]]), 'line-opacity': 0.85 },
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
        paint: { 'text-color': p.labelWater, 'text-halo-color': p.labelHalo, 'text-halo-width': 1.5 },
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
        paint: { 'text-color': p.label, 'text-halo-color': p.labelHalo, 'text-halo-width': 1.5 },
      },
    ],
  };
}
