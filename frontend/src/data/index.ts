import type { Pin } from '../markers/types';
import type { PinProvider } from './types';
import { warsawOpenDataProvider } from './warsawOpenData';

/** Register new providers here; they are loaded by `loadPins`. */
const providers: PinProvider[] = [warsawOpenDataProvider];

/**
 * Fetches pins from every provider. A failing provider is logged and skipped,
 * so one broken dataset never blanks the map.
 */
export async function loadPins(list: PinProvider[] = providers, signal?: AbortSignal): Promise<Pin[]> {
  const results = await Promise.allSettled(list.map(provider => provider.fetchPins(signal)));
  return results.flatMap((result, i) => {
    if (result.status === 'fulfilled') return result.value;
    console.warn(`Pin provider "${list[i].id}" failed`, result.reason);
    return [];
  });
}
