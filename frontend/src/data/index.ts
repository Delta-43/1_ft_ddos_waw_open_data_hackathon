import type { Pin } from '../markers/types';
import type { PinProvider } from './types';
import { cityLayerProviders } from './cityLayers';
import { placesProvider } from './places';

/** Register new providers here; they are loaded by `loadPins`. */
const providers: PinProvider[] = [placesProvider, ...cityLayerProviders];

/**
 * Fetches pins from every provider. A failing provider is logged and skipped,
 * so one broken dataset never blanks the map.
 */
export async function loadPins(list: PinProvider[] = providers, signal?: AbortSignal): Promise<Pin[]> {
  const results = await Promise.allSettled(list.map(provider => provider.fetchPins(signal)));
  return results.flatMap((result, i) => {
    if (result.status === 'fulfilled') return result.value;
    // A cancelled request (map unmounted, e.g. React StrictMode's test mount) is not a failure.
    if (!signal?.aborted) console.warn(`Pin provider "${list[i].id}" failed`, result.reason);
    return [];
  });
}
