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
    button.textContent = '⟲';
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
