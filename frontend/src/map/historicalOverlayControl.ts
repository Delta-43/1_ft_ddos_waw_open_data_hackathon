import type { ErrorEvent, IControl, Map } from 'maplibre-gl';
import { attributionText, HISTORICAL_LAYERS, showHistoricalLayer } from './historicalOverlay';

/** Floating attribution label, bottom-left (clear of the top-right toggle and
 * the bottom-right chat widget). The team's convention is that base-tile
 * attribution lives in the fixed bottom bar (MapCredits), not floating over
 * the map - this is the one exception, agreed in review, because the
 * overlay is optional and only sometimes on screen.
 *
 * A plain absolutely-positioned element appended to the map container,
 * not a second MapLibre IControl: adding a control from inside another
 * control's own onAdd (a re-entrant map.addControl call while the outer
 * one is still being processed) left the map's style never finishing
 * initialisation - found by testing, not assumed - so this avoids
 * map.addControl entirely. */
class HistoricalAttributionLabel {
  private readonly element: HTMLDivElement;

  constructor(map: Map) {
    const element = document.createElement('div');
    element.className = 'historical-attribution';
    element.hidden = true;
    map.getContainer().append(element);
    this.element = element;
  }

  show(text: string): void {
    this.element.textContent = text;
    this.element.hidden = false;
  }

  hide(): void {
    this.element.hidden = true;
  }

  remove(): void {
    this.element.remove();
  }
}

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
  private attribution?: HistoricalAttributionLabel;
  private index = -1; // -1 = off
  private unavailable = new Set<string>(); // layer ids whose image failed to load
  private styleReady = false; // set once by the map's `load`; layers can only be added after it

  private label(): string {
    if (this.index === -1) return '🕰';
    const layer = HISTORICAL_LAYERS[this.index];
    return this.unavailable.has(layer.id) ? '⚠' : String(layer.year);
  }

  private title(): string {
    if (this.index === -1) return 'Show historical map overlay';
    const layer = HISTORICAL_LAYERS[this.index];
    return this.unavailable.has(layer.id) ? `${layer.title} — unavailable right now` : layer.title;
  }

  private applyIndex(map: Map): void {
    // Before `load` only the button updates; the sync in onAdd applies the selection afterwards.
    if (this.styleReady) showHistoricalLayer(map, this.index);
    if (this.button) {
      this.button.textContent = this.label();
      this.button.title = this.title();
    }
    const active = this.index !== -1 && !this.unavailable.has(HISTORICAL_LAYERS[this.index].id);
    if (active) this.attribution?.show(attributionText(HISTORICAL_LAYERS[this.index]));
    else this.attribution?.hide();
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
      this.applyIndex(map);
    });
    container.append(button);
    this.container = container;
    this.button = button;
    this.attribution = new HistoricalAttributionLabel(map);

    // A failed image load (WMS slow/unreachable during the pitch) must not
    // silently leave the toggle looking dead - mark that year unavailable
    // and fall back to "off" if it was the one on screen.
    map.on('error', (event: ErrorEvent & { sourceId?: string }) => {
      const failed = HISTORICAL_LAYERS.find(layer => event.sourceId === `historical-${layer.id}`);
      if (!failed || this.unavailable.has(failed.id)) return;
      this.unavailable.add(failed.id);
      if (HISTORICAL_LAYERS[this.index]?.id === failed.id) this.index = -1;
      this.applyIndex(map);
    });

    // No image is added here: each year's source is added on its first selection.
    const sync = () => {
      this.styleReady = true;
      this.applyIndex(map);
    };
    if (map.isStyleLoaded()) sync();
    else map.once('load', sync);

    return container;
  }

  onRemove(): void {
    this.attribution?.remove();
    this.attribution = undefined;
    this.container?.remove();
    this.container = undefined;
    this.button = undefined;
  }
}
