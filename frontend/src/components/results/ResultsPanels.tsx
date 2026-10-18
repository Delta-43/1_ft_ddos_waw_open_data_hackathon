import { useState } from 'react';
import type { RouteResponse } from '../../api/contract';
import { useT } from '../../i18n/useT';
import { PlaceCardList } from '../places/PlaceCardList';
import { RouteComparison } from './RouteComparison';
import './results.css';

interface ResultsPanelsProps {
  result: RouteResponse;
  selectedId: string | undefined;
  onSelect: (id: string) => void;
  selectedPlaceId?: string;
  onShowPlace: (placeId: string) => void;
}

type Tab = 'routes' | 'stops';

/**
 * Desktop: routes on the left, stops and place cards on the right.
 * Mobile: one frosted bottom sheet with Routes · Stops tabs (Sources lives in the bottom bar).
 */
export function ResultsPanels({ result, selectedId, onSelect, selectedPlaceId, onShowPlace }: ResultsPanelsProps) {
  const t = useT();
  const [tab, setTab] = useState<Tab>('routes');
  const route = result.routes.find(candidate => candidate.id === selectedId) ?? result.routes[0];
  const tabs: [Tab, string][] = [['routes', t('tabRoutes')], ['stops', t('tabStops')]];

  return (
    <div className="results" data-tab={tab}>
      <div className="results__tabs" role="tablist" aria-label={t('resultsAriaLabel')}>
        {tabs.map(([id, label]) => (
          <button key={id} type="button" role="tab" aria-selected={tab === id} className="results__tab" onClick={() => setTab(id)}>
            {label}
          </button>
        ))}
      </div>
      <div className="results__panel results__panel--routes">
        <RouteComparison
          routes={result.routes}
          sources={result.sources}
          selectedId={route?.id}
          onSelect={id => { onSelect(id); setTab('stops'); }}
          explainedByModel={result.preferences.interpreted_by === 'model'}
          notice={result.notice}
        />
      </div>
      <div className="results__panel results__panel--stops">
        {route && (
          <PlaceCardList
            places={route.places}
            mode={result.mode}
            routeName={route.name}
            sources={result.sources}
            stops={route.stops}
            selectedPlaceId={selectedPlaceId}
            onShowOnMap={onShowPlace}
          />
        )}
      </div>
    </div>
  );
}
