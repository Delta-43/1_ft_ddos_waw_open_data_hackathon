import type { Pin } from '../markers/types';

/** A source of pins, e.g. one Warsaw open-data dataset served by our backend. */
export interface PinProvider {
  id: string;
  /** Human-readable name, e.g. for a layer toggle. */
  label: string;
  /** Credit line required by the dataset licence; show it in the UI. */
  attribution: string;
  fetchPins(signal?: AbortSignal): Promise<Pin[]>;
}
