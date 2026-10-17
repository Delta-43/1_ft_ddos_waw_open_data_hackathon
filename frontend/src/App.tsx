import type { Map, PaddingOptions } from 'maplibre-gl';
import { useEffect, useState } from 'react';
import { HintPill } from './components/layout/HintPill';
import { PlacePopup } from './components/places/PlacePopup';
import { PreferenceChips } from './components/layout/PreferenceChips';
import { TopBar } from './components/layout/TopBar';
import { AssistantWidget } from './components/preferences/AssistantWidget';
import { MapCredits } from './components/provenance/MapCredits';
import { SourcesStrip } from './components/provenance/SourcesStrip';
import { ResultsPanels } from './components/results/ResultsPanels';
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

/** Map space the floating panels cover, so a fitted route stays in the open area. */
const DESKTOP_PADDING: PaddingOptions = { top: 140, bottom: 80, left: 440, right: 480 };
const MOBILE_PADDING: PaddingOptions = { top: 150, bottom: 420, left: 32, right: 32 };

type Curtain = 'down' | 'lifting' | 'up';

export function App() {
  const outing = useOuting();
  const { result, status } = outing;
  const [selectedId, setSelectedId] = useState<string>();
  const [curtain, setCurtain] = useState<Curtain>('down');
  const [introDone, setIntroDone] = useState(false);
  const [located, setLocated] = useState<boolean | null>(null);
  const [sourcesOpen, setSourcesOpen] = useState(false);
  const [assistantOpen, setAssistantOpen] = useState(false);
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

  const chromeClass = ['app-chrome', introDone && 'app-chrome--in', assistantOpen && 'app-chrome--assistant-open'].filter(Boolean).join(' ');

  return (
    <>
      <MapView
        routes={result?.routes}
        selectedRouteId={selectedId}
        padding={mobile ? MOBILE_PADDING : DESKTOP_PADDING}
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
        <TopBar
          mode={result?.mode}
          onOpenSources={result ? () => setSourcesOpen(open => !open) : undefined}
        >
          {result && <PreferenceChips understood={result.preferences} busy={status.state === 'loading'} onChange={outing.refine} />}
        </TopBar>
        {result && (
          <ResultsPanels
            result={result}
            selectedId={selectedId}
            onSelect={id => { setSelectedId(id); setPopupPlaceId(undefined); }}
            selectedPlaceId={popupPlaceId}
            onShowPlace={setPopupPlaceId}
          />
        )}
        <div className="hint-stack">
          {!result && !assistantOpen && <HintPill>Describe your outing to see routes</HintPill>}
          {!result && located === false && <HintPill>Showing central Warsaw · location off</HintPill>}
        </div>
        <footer className="sources-bar">
          <MapCredits />
          {result ? (
            <SourcesStrip
              variant="bar"
              notice={result.notice}
              sources={result.sources}
              mode={result.mode}
              generatedAt={result.generated_at}
              open={sourcesOpen}
              onOpenChange={setSourcesOpen}
            />
          ) : (
            <span className="sources-bar__empty">We don’t store your requests or location.</span>
          )}
        </footer>
        <AssistantWidget
          open={assistantOpen}
          onOpenChange={setAssistantOpen}
          messages={outing.messages}
          status={status}
          onAsk={outing.ask}
        />
      </div>
    </>
  );
}
