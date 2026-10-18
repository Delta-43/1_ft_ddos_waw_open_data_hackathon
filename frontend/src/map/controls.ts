import type { IControl, Map } from 'maplibre-gl';
import { INITIAL_VIEW } from './config';

/** Single-button control that flies the camera back to the initial view. */
export class ResetViewControl implements IControl {
  private container?: HTMLDivElement;

  onAdd(map: Map): HTMLElement {
    const container = document.createElement('div');
    container.className = 'maplibregl-ctrl maplibregl-ctrl-group';
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'reset-view-button';
    button.title = 'Reset view';
    button.setAttribute('aria-label', 'Reset view');
    button.innerHTML =
      '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      '<path d="M4 12a8 8 0 1 0 2.4-5.7"/><path d="M4 4v4.5h4.5"/></svg>';
    button.addEventListener('click', () => map.flyTo({ ...INITIAL_VIEW, duration: 1600 }));
    container.append(button);
    this.container = container;
    return container;
  }

  onRemove(): void {
    this.container?.remove();
    this.container = undefined;
  }
}
