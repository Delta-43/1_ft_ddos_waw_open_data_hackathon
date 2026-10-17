import type { Pin } from '../markers/types';

/** A source of pins, e.g. one city dataset served by our backend. */
export interface PinProvider {
  id: string;
  /** Human-readable name, e.g. for a layer toggle. */
  label: string;
  /** Pins carry their own source credit (`Pin.attribution`) and data-mode badge. */
  fetchPins(signal?: AbortSignal): Promise<Pin[]>;
}
