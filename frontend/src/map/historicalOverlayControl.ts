import type { IControl, Map } from 'maplibre-gl';
import { addHistoricalOverlays, HISTORICAL_LAYERS, showHistoricalLayer } from './historicalOverlay';

/**
 * Single-button control that cycles through the historical overlays (off ->
 * 1935 -> 1939 -> 1945 -> off). A dropdown or opacity slider would be nicer,
 * but a cycling toggle needs no extra UI chrome and fits the same
 * single-button pattern as ResetViewControl.
 *
 * Owns the overlay layers' lifecycle itself (rather than relying on
 * createMap.ts to add them separately) so a click before the style has
 * finished loading still ends up correct: the button's `index` updates
 * immediately either way, and the `load` handler re-applies it once the
 * layers actually exist, instead of the visual update silently being lost.
 */
export class HistoricalOverlayControl implements IControl {
  private container?: HTMLDivElement;
  private button?: HTMLButtonElement;
  private index = -1; // -1 = off

  private label(): string {
    return this.index === -1 ? '🕰' : String(HISTORICAL_LAYERS[this.index].year);
  }

  private title(): string {
    return this.index === -1 ? 'Show historical map overlay' : HISTORICAL_LAYERS[this.index].title;
  }

  onAdd(map: Map): HTMLElement {
    const container = document.createElement('div');
    container.className = 'maplibregl-ctrl maplibregl-ctrl-group';
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'historical-overlay-button';
    button.title = this.title();
    button.setAttribute('aria-label', 'Toggle historical map overlay');
    button.textContent = this.label();
    button.addEventListener('click', () => {
      this.index = this.index === HISTORICAL_LAYERS.length - 1 ? -1 : this.index + 1;
      showHistoricalLayer(map, this.index); // no-op before the layers exist; the sync below catches up
      button.textContent = this.label();
      button.title = this.title();
    });
    container.append(button);
    this.container = container;
    this.button = button;

    const sync = () => {
      addHistoricalOverlays(map);
      showHistoricalLayer(map, this.index);
    };
    if (map.isStyleLoaded()) sync();
    else map.once('load', sync);

    return container;
  }

  onRemove(): void {
    this.container?.remove();
    this.container = undefined;
    this.button = undefined;
  }
}
