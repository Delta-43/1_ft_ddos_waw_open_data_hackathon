import type { ResponseMode, Source } from '../../api/contract';
import type { PinCategory } from '../../markers/types';
import { DataModeBadge } from './DataModeBadge';
import { MapCredits } from './MapCredits';
import { SourcesDrawer } from './SourcesDrawer';
import './provenance.css';

/** City layers a visitor can put on the map; all off by default so the route leads (#114). */
export const PIN_LAYERS: { id: string; label: string; categories: PinCategory[] }[] = [
  { id: 'places', label: 'Places (OpenStreetMap)', categories: ['landmark', 'museum', 'park', 'generic'] },
  { id: 'air', label: 'Air quality stations', categories: ['air'] },
  { id: 'aed', label: 'Defibrillators (AED)', categories: ['aed'] },
  { id: 'toilet', label: 'Public toilets', categories: ['toilet'] },
  { id: 'event', label: 'Cultural events', categories: ['event'] },
];

interface SourcesPanelProps {
  mode?: ResponseMode;
  sources?: Source[];
  notice?: string;
  /** Ids from PIN_LAYERS that are switched on. */
  layersOn: ReadonlySet<string>;
  onToggleLayer: (id: string) => void;
}

/** The Sources panel: map credits and the privacy promise (moved from the old bottom line), city layers, and every source of the answer. */
export function SourcesPanel({ mode, sources, notice, layersOn, onToggleLayer }: SourcesPanelProps) {
  return (
    <div className="sources-panel">
      <h2 className="corner__heading">Sources {mode && <DataModeBadge mode={mode} />}</h2>
      <p className="corner__text sources-panel__credits"><MapCredits /></p>
      <p className="corner__text">We don’t store your requests or location.</p>

      <h3 className="sources-drawer__heading">Show on the map</h3>
      <ul className="sources-panel__layers">
        {PIN_LAYERS.map(layer => (
          <li key={layer.id}>
            <label className="sources-panel__layer">
              <input type="checkbox" checked={layersOn.has(layer.id)} onChange={() => onToggleLayer(layer.id)} />
              {layer.label}
            </label>
          </li>
        ))}
      </ul>

      {sources ? (
        <SourcesDrawer sources={sources} notice={notice} />
      ) : (
        <p className="corner__text">Sources of the routes, scores and opening hours appear here once the assistant has found routes.</p>
      )}
    </div>
  );
}
