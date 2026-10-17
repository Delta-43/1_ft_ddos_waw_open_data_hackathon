import type { PaddingOptions } from 'maplibre-gl';
import { useEffect, useState } from 'react';
import type { RouteResponse } from './api/contract';
import { HintPill } from './components/layout/HintPill';
import { TopBar } from './components/layout/TopBar';
import { AssistantWidget } from './components/preferences/AssistantWidget';
import { SourcesStrip } from './components/provenance/SourcesStrip';
import { ResultsPanels } from './components/results/ResultsPanels';
import { MapView } from './map/MapView';
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
const DESKTOP_PADDING: PaddingOptions = { top: 140, bottom: 90, left: 440, right: 480 };
const MOBILE_PADDING: PaddingOptions = { top: 130, bottom: 420, left: 32, right: 32 };

type Curtain = 'down' | 'lifting' | 'up';

export function App() {
  const [result, setResult] = useState<RouteResponse | null>(null);
  const [selectedId, setSelectedId] = useState<string>();
  const [curtain, setCurtain] = useState<Curtain>('down');
  const [introDone, setIntroDone] = useState(false);
  const [located, setLocated] = useState<boolean | null>(null);
  const [sourcesOpen, setSourcesOpen] = useState(false);
  const mobile = useIsMobile();

  // Safety net: if tiles never load (no network), lift the curtain and show the UI anyway.
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setCurtain(current => (current === 'down' ? 'lifting' : current));
      setIntroDone(true);
    }, 6000);
    return () => window.clearTimeout(timer);
  }, []);

  function showResult(response: RouteResponse) {
    setResult(response);
    setSelectedId((response.routes.find(route => route.recommended) ?? response.routes[0])?.id);
  }

  return (
    <>
      <MapView
        routes={result?.routes}
        selectedRouteId={selectedId}
        padding={mobile ? MOBILE_PADDING : DESKTOP_PADDING}
        onIntroStart={() => setCurtain('lifting')}
        onIntroDone={wasLocated => { setIntroDone(true); setLocated(wasLocated); }}
      />
      {curtain !== 'up' && (
        <div className={`intro-curtain intro-curtain--${curtain}`} aria-hidden="true" onTransitionEnd={() => setCurtain('up')} />
      )}
      <div className={`app-chrome${introDone ? ' app-chrome--in' : ''}`}>
        <TopBar
          mode={result?.mode}
          notice={result?.notice}
          onOpenSources={result ? () => setSourcesOpen(open => !open) : undefined}
        />
        {result && <ResultsPanels result={result} selectedId={selectedId} onSelect={setSelectedId} />}
        <div className="hint-stack">
          {!result && <HintPill>Describe your outing to see routes</HintPill>}
          {!result && located === false && <HintPill>Showing central Warsaw · location off</HintPill>}
        </div>
        <footer className="sources-bar">
          {result ? (
            <SourcesStrip
              sources={result.sources}
              mode={result.mode}
              generatedAt={result.generated_at}
              open={sourcesOpen}
              onOpenChange={setSourcesOpen}
            />
          ) : (
            <p className="sources-bar__empty">Data sources appear with your first route · we don’t store your requests or location.</p>
          )}
        </footer>
        <AssistantWidget onResult={showResult} />
      </div>
    </>
  );
}
