import type { Map, PaddingOptions } from 'maplibre-gl';
import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { PlacePopup } from './components/places/PlacePopup';
import { MapCredits } from './components/provenance/MapCredits';
import { Agent, type AgentPhase } from './components/shell/Agent';
import { moodForTrack } from './components/shell/moods';
import { TitleBar } from './components/shell/TitleBar';
import { INITIAL_VIEW } from './map/config';
import { MapView } from './map/MapView';
import { startParallax } from './map/parallax';
import { useOuting } from './useOuting';
import './components/shell/shell.css';

const MOBILE_QUERY = '(max-width: 700px)';
/** Warm amber, the streets' colour, until a mood picks its own. */
const DEFAULT_ACCENT = '#ffb35c';

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

/**
 * Map padding per view. Home shifts the map's centre into the spotlight (left of centre on a
 * desktop, upper half on a phone); a trip keeps the route clear of the docked panel.
 */
function paddingFor(home: boolean, mobile: boolean): PaddingOptions {
  const { innerWidth: width, innerHeight: height } = window;
  if (home) return mobile ? { top: 0, bottom: Math.round(height * 0.3), left: 0, right: 0 } : { top: 0, bottom: 0, left: 0, right: Math.round(width * 0.24) };
  return mobile
    ? { top: 100, bottom: Math.round(height * 0.55), left: 30, right: 30 }
    : { top: 110, bottom: 70, left: 80, right: 470 };
}

/** City pins stay hidden in this calm view: the trip's own numbered stops carry the places. */
function showPins(map: Map, visible: boolean): () => void {
  const apply = () => {
    if (!map.getLayer('pins')) return false;
    map.setLayoutProperty('pins', 'visibility', visible ? 'visible' : 'none');
    return true;
  };
  if (apply()) return () => {};
  const onData = () => { if (apply()) map.off('data', onData); };
  map.on('data', onData);
  return () => map.off('data', onData);
}

type Curtain = 'down' | 'lifting' | 'up';

export function App() {
  const outing = useOuting();
  const { result, status } = outing;
  const [composing, setComposing] = useState(false);
  const [selectedId, setSelectedId] = useState<string>();
  const [curtain, setCurtain] = useState<Curtain>('down');
  const [introDone, setIntroDone] = useState(false);
  const [sourcesOpen, setSourcesOpen] = useState(false);
  const [map, setMap] = useState<Map | null>(null);
  const [popupPlaceId, setPopupPlaceId] = useState<string>();
  const spotlight = useRef<HTMLDivElement>(null);
  const mobile = useIsMobile();

  const home = !result;
  const phase: AgentPhase = result ? 'result' : composing ? 'compose' : 'home';
  const accent = moodForTrack(result?.track?.id)?.accent ?? DEFAULT_ACCENT;
  const padding = paddingFor(home, mobile);

  // Safety net: if tiles never load (no network), lift the curtain and show the UI anyway.
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setCurtain(current => (current === 'down' ? 'lifting' : current));
      setIntroDone(true);
    }, 6000);
    return () => window.clearTimeout(timer);
  }, []);

  // Compose the opening shot around the spotlight before the intro flies in.
  useEffect(() => {
    if (map) map.setPadding(paddingFor(true, mobile));
  }, [map]);

  // Home is a still backdrop: no dragging or zooming until there is a route to explore.
  useEffect(() => {
    if (!map) return;
    const handlers = [map.dragPan, map.scrollZoom, map.boxZoom, map.dragRotate, map.keyboard, map.doubleClickZoom, map.touchZoomRotate, map.touchPitch];
    for (const handler of handlers) (home ? handler.disable() : handler.enable());
    return showPins(map, false);
  }, [map, home]);

  // On the home view the camera leans towards the mouse and the spotlight drifts with it.
  useEffect(() => {
    if (!map || !home || !introDone) return;
    return startParallax(map, {
      bearing: INITIAL_VIEW.bearing,
      pitch: INITIAL_VIEW.pitch,
      onMove: (x, y) => {
        spotlight.current?.style.setProperty('--drift-x', `${(x * 3).toFixed(2)}%`);
        spotlight.current?.style.setProperty('--drift-y', `${(y * 3).toFixed(2)}%`);
      },
    });
  }, [map, home, introDone]);

  // Each new response selects its recommended route and closes the opening bubble.
  useEffect(() => {
    if (!result) return;
    setSelectedId((result.routes.find(route => route.recommended) ?? result.routes[0])?.id);
    setComposing(false);
    setPopupPlaceId(undefined);
  }, [result]);

  const selectedRoute = result?.routes.find(route => route.id === selectedId);

  function selectRoute(id: string) {
    setSelectedId(id);
    setPopupPlaceId(undefined);
  }

  function goHome() {
    outing.reset();
    setComposing(false);
    setSourcesOpen(false);
    setPopupPlaceId(undefined);
    setSelectedId(undefined);
  }

  const shellClass = ['shell', home ? 'shell--home' : 'shell--trip', introDone && 'shell--in'].filter(Boolean).join(' ');

  return (
    <div className={shellClass} style={{ '--accent': accent } as CSSProperties}>
      <MapView
        routes={result?.routes}
        selectedRouteId={selectedId}
        padding={padding}
        accent={result ? accent : undefined}
        locate={false}
        onIntroStart={() => setCurtain('lifting')}
        onIntroDone={() => setIntroDone(true)}
        onMapReady={setMap}
        onStopClick={setPopupPlaceId}
      />
      <div ref={spotlight} className="spotlight" aria-hidden="true" />
      <div className="vignette" aria-hidden="true" />
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
      <TitleBar onHome={result || composing ? goHome : undefined} />
      <Agent
        phase={phase}
        status={status}
        result={result}
        aiTrackId={outing.aiTrackId}
        selectedRouteId={selectedId}
        selectedPlaceId={popupPlaceId}
        accent={accent}
        sourcesOpen={sourcesOpen}
        onOpen={() => setComposing(true)}
        onClose={() => setComposing(false)}
        onAsk={outing.ask}
        onChooseTrack={outing.chooseTrack}
        onSelectRoute={selectRoute}
        onShowPlace={placeId => setPopupPlaceId(current => (current === placeId ? undefined : placeId))}
        onToggleSources={() => setSourcesOpen(open => !open)}
        onReset={goHome}
      />
      <p className="credits">
        <MapCredits /> · We don’t store your requests or location.
      </p>
    </div>
  );
}
