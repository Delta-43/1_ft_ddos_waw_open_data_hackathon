import type { PinProvider } from './types';

/**
 * STUB: future Warsaw open-data provider (dane.um.warszawa.pl / dane.gov.pl).
 *
 * The city API needs a key, and keys must stay on the backend (AGENTS.md), so do
 * not call the city API from the browser. When the backend pair exposes a bounded
 * endpoint (e.g. relative `/api/places`), fetch it here and map each record to a Pin,
 * keeping the dataset's source, date and licence in `properties`.
 */
export const warsawOpenDataProvider: PinProvider = {
  id: 'warsaw-open-data',
  label: 'Warsaw open data',
  attribution: 'Miasto Stołeczne Warszawa (dane.um.warszawa.pl)',
  async fetchPins() {
    return [];
  },
};
