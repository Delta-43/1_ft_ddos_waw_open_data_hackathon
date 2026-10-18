import type { IControl, Map } from 'maplibre-gl';
import { getLang, subscribe } from '../i18n/language';
import { translate } from '../i18n/translations';
import { INITIAL_VIEW } from './config';

/** Single-button control that flies the camera back to the initial view. */
export class ResetViewControl implements IControl {
  private container?: HTMLDivElement;
  private unsubscribe?: () => void;

  onAdd(map: Map): HTMLElement {
    const container = document.createElement('div');
    container.className = 'maplibregl-ctrl maplibregl-ctrl-group';
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'reset-view-button';
    const applyText = () => {
      const text = translate(getLang(), 'resetView');
      button.title = text;
      button.setAttribute('aria-label', text);
    };
    applyText();
    this.unsubscribe = subscribe(applyText);
    // An authored icon, not a glyph: a circular arrow.
    button.innerHTML = '<svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true"><path d="M15.5 10a5.5 5.5 0 1 1-1.6-3.9M15.5 3.5v3h-3" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    button.addEventListener('click', () => map.flyTo({ ...INITIAL_VIEW, duration: 1600 }));
    container.append(button);
    this.container = container;
    return container;
  }

  onRemove(): void {
    this.unsubscribe?.();
    this.unsubscribe = undefined;
    this.container?.remove();
    this.container = undefined;
  }
}
