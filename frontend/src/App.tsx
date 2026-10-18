import type { Map, PaddingOptions } from 'maplibre-gl';
import { useEffect, useMemo, useState } from 'react';
import { CornerPanel } from './components/layout/CornerPanel';
import { HintPill } from './components/layout/HintPill';
import { PlacePopup } from './components/places/PlacePopup';
import { PreferenceChips } from './components/layout/PreferenceChips';
import { TopBar } from './components/layout/TopBar';
import { AssistantWidget } from './components/preferences/AssistantWidget';
import { PIN_LAYERS, SourcesPanel } from './components/provenance/SourcesPanel';
import { MapView } from './map/MapView';
import { useOuting } from './useOuting';
import './components/layout/layout.css';
import './components/results/results.css';

const MOBILE_QUERY = '(max-width: 700px)';

function useIsMobile(): boolean {
  const [mobile, setMobile] = useState(() => window.matchMedia(MOBILE_QUERY).matches);
  useEffect(() => {
    const query = window.matchMedia(MOBILE_QUERY);
    const update = () => setMobile(query.matches);
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);
  return mobile;
}

/** Map space the round buttons and the open chat cover, so a fitted route stays in the open area. */
const DESKTOP_PADDING: PaddingOptions = { top: 120, bottom: 100, left: 120, right: 120 };
const DESKTOP_PADDING_CHAT: PaddingOptions = { ...DESKTOP_PADDING, right: 560 };
const MOBILE_PADDING: PaddingOptions = { top: 150, bottom: 140, left: 32, right: 72 };

const PREFERENCES_ICON = (
  <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
    <path d="M4 7h9M17 7h3M4 17h3M11 17h9" />
    <circle cx="15" cy="7" r="2.2" />
    <circle cx="9" cy="17" r="2.2" />
  </svg>
);
const SOURCES_ICON = (
  <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
    <circle cx="12" cy="12" r="9" />
    <path d="M12 11v6" />
    <circle cx="12" cy="7.5" r="0.6" fill="currentColor" />
  </svg>
);

type Curtain = 'down' | 'lifting' | 'up';

export function App() {
  const outing = useOuting();
  const { result, status } = outing;
  const [selectedId, setSelectedId] = useState<string>();
  const [curtain, setCurtain] = useState<Curtain>('down');
  const [introDone, setIntroDone] = useState(false);
  const [located, setLocated] = useState<boolean | null>(null);
  const [sourcesOpen, setSourcesOpen] = useState(false);
  const [preferencesOpen, setPreferencesOpen] = useState(false);
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [layersOn, setLayersOn] = useState<ReadonlySet<string>>(new Set());
  const [map, setMap] = useState<Map | null>(null);
  const [popupPlaceId, setPopupPlaceId] = useState<string>();
  const mobile = useIsMobile();

  // Safety net: if tiles never load (no network), lift the curtain and show the UI anyway.
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setCurtain(current => (current === 'down' ? 'lifting' : current));
      setIntroDone(true);
    }, 6000);
    return () => window.clearTimeout(timer);
  }, []);

  // Each new response selects its recommended route; on a phone the assistant makes room for it.
  useEffect(() => {
    if (!result) return;
    setSelectedId((result.routes.find(route => route.recommended) ?? result.routes[0])?.id);
    if (mobile) setAssistantOpen(false);
    setPopupPlaceId(undefined);
    // Only a new response should do this, not a resize, so `mobile` is read but not a dependency.
  }, [result]);

  const selectedRoute = result?.routes.find(route => route.id === selectedId);
  const pinCategories = useMemo(
    () => new Set(PIN_LAYERS.filter(layer => layersOn.has(layer.id)).flatMap(layer => layer.categories)),
    [layersOn],
  );

  function toggleLayer(id: string) {
    setLayersOn(current => {
      const next = new Set(current);
      if (!next.delete(id)) next.add(id);
      return next;
    });
  }

  /** On a phone one panel at a time: opening one closes the others. */
  function opener(set: (open: boolean) => void) {
    return (open: boolean) => {
      if (open && mobile) [setAssistantOpen, setPreferencesOpen, setSourcesOpen].forEach(other => other !== set && other(false));
      set(open);
    };
  }

  function selectRoute(id: string) {
    setSelectedId(id);
    setPopupPlaceId(undefined);
  }

  const chromeClass = ['app-chrome', introDone && 'app-chrome--in', assistantOpen && 'app-chrome--assistant-open'].filter(Boolean).join(' ');

  return (
    <>
      <MapView
        routes={result?.routes}
        selectedRouteId={selectedId}
        padding={mobile ? MOBILE_PADDING : assistantOpen ? DESKTOP_PADDING_CHAT : DESKTOP_PADDING}
        pinCategories={pinCategories}
        onIntroStart={() => setCurtain('lifting')}
        onIntroDone={wasLocated => { setIntroDone(true); setLocated(wasLocated); }}
        onMapReady={setMap}
        onStopClick={setPopupPlaceId}
      />
      {map && selectedRoute && popupPlaceId && (
        <PlacePopup
          key={popupPlaceId}
          map={map}
          route={selectedRoute}
          placeId={popupPlaceId}
          sources={result?.sources ?? []}
          onClose={() => setPopupPlaceId(undefined)}
        />
      )}
      {curtain !== 'up' && (
        <div className={`intro-curtain intro-curtain--${curtain}`} aria-hidden="true" onTransitionEnd={() => setCurtain('up')} />
      )}
      <div className={chromeClass}>
        <TopBar mode={result?.mode} />
        <CornerPanel corner="top-left" label="Preferences" icon={PREFERENCES_ICON} open={preferencesOpen} onOpenChange={opener(setPreferencesOpen)}>
          <PreferenceChips understood={result?.preferences} busy={status.state === 'loading'} onChange={outing.refine} />
        </CornerPanel>
        <div className="hint-stack">
          {!result && !assistantOpen && <HintPill>Describe your outing to see routes</HintPill>}
          {!result && located === false && <HintPill>Showing central Warsaw · location off</HintPill>}
        </div>
        <CornerPanel corner="bottom-left" label="Sources" icon={SOURCES_ICON} open={sourcesOpen} onOpenChange={opener(setSourcesOpen)}>
          <SourcesPanel mode={result?.mode} sources={result?.sources} notice={result?.notice} layersOn={layersOn} onToggleLayer={toggleLayer} />
        </CornerPanel>
        <AssistantWidget
          open={assistantOpen}
          onOpenChange={opener(setAssistantOpen)}
          messages={outing.messages}
          status={status}
          onAsk={outing.ask}
          routes={result?.routes}
          sources={result?.sources}
          notice={result?.notice}
          explainedByModel={result?.preferences.interpreted_by === 'model'}
          selectedRouteId={selectedId}
          onSelectRoute={selectRoute}
        />
      </div>
    </>
  );
}
