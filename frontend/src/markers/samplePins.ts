import type { Pin } from './types';

/**
 * PLACEHOLDER DATA — three hand-placed pins that prove the pin pipeline works.
 * Coordinates are approximate and nothing here comes from an open-data source.
 * Remove once a real provider (see src/data/) supplies pins.
 */
export const samplePins: Pin[] = [
  {
    id: 'placeholder-palace-of-culture',
    lat: 52.2318,
    lng: 21.0059,
    category: 'landmark',
    title: 'Palace of Culture and Science',
    properties: { source: 'placeholder', note: 'Sample pin, not open data' },
  },
  {
    id: 'placeholder-royal-castle',
    lat: 52.2480,
    lng: 21.0152,
    category: 'museum',
    title: 'Royal Castle',
    properties: { source: 'placeholder', note: 'Sample pin, not open data' },
  },
  {
    id: 'placeholder-lazienki-park',
    lat: 52.2150,
    lng: 21.0353,
    category: 'park',
    title: 'Łazienki Park',
    properties: { source: 'placeholder', note: 'Sample pin, not open data' },
  },
];
