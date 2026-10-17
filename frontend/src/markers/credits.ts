/**
 * Licence credits of the data shown as pins (plain text, one per source), for the page's
 * credit line in the bottom bar (components/provenance/MapCredits.tsx). The map has no
 * MapLibre attribution control, so this is where pin sources are credited.
 * Shaped for React's useSyncExternalStore.
 */
let current: readonly string[] = [];
const listeners = new Set<() => void>();

export function setPinCredits(credits: Iterable<string>): void {
  const next = [...credits];
  if (next.length === current.length && next.every((credit, i) => credit === current[i])) return;
  current = next;
  for (const listener of listeners) listener();
}

export const pinCredits = {
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => void listeners.delete(listener);
  },
  getSnapshot: () => current,
};
