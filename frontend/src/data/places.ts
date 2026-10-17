import { PIN_CATEGORIES, type Pin, type PinCategory } from '../markers/types';
import { getJson, modeBadge, sourceRows, WARSAW_BBOX, type ApiSource } from './api';
import type { PinProvider } from './types';

interface ApiPlace {
  id: string;
  name: string;
  longitude: number;
  latitude: number;
  category: string;
  summary?: string | null;
  opening_hours?: string | null;
  address?: string | null;
  website?: string | null;
  source_id: string;
}

/** Places (museums, landmarks, parks) from `GET /api/places`, OpenStreetMap-based. */
export const placesProvider: PinProvider = {
  id: 'places',
  label: 'Places',
  async fetchPins(signal) {
    const data = await getJson<{ places: ApiPlace[]; sources: ApiSource[] }>(
      `/api/places?bbox=${WARSAW_BBOX}&limit=100`,
      signal,
    );
    const sources = new Map(data.sources.map(source => [source.id, source]));
    return data.places.map((place): Pin => {
      const source = sources.get(place.source_id);
      const properties: Pin['properties'] = {};
      if (place.summary) properties.About = place.summary;
      if (place.opening_hours) properties['Opening hours'] = place.opening_hours;
      if (place.address) properties.Address = place.address;
      if (place.website) properties.Website = place.website;
      return {
        id: place.id,
        lat: place.latitude,
        lng: place.longitude,
        category: (PIN_CATEGORIES as readonly string[]).includes(place.category) ? (place.category as PinCategory) : 'generic',
        title: place.name,
        properties: { ...properties, ...sourceRows(source) },
        badge: modeBadge(source),
        attribution: source?.attribution,
      };
    });
  },
};
