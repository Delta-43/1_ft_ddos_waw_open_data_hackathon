import type { Map, PaddingOptions } from 'maplibre-gl';
import { useEffect, useRef, useState, type CSSProperties } from 'react';
import type { Place, Source } from './api/contract';
import { DEMO } from './demo/mode';
import { DemoBar } from './demo/DemoBar';
import { MockupPanel, type MockTab } from './demo/MockupPanel';
import { captionVars, type ScenarioApi } from './demo/scenarios';
import { ScenarioCaption } from './demo/ScenarioCaption';
import { SearchPopup } from './demo/SearchPopup';
import { useScenario } from './demo/useScenario';
import { PlacePopup } from './components/places/PlacePopup';
import { MapCredits } from './components/provenance/MapCredits';
import { Agent, type AgentPhase } from './components/shell/Agent';
import { moodForTrack } from './components/shell/moods';
import { Reports } from './components/shell/Reports';
import { TitleBar } from './components/shell/TitleBar';
import { INITIAL_VIEW } from './map/config';
import { amenitiesNear, type AmenityKind } from './map/amenities';
import { MapView } from './map/MapView';
import { startParallax } from './map/parallax';
import { startRouteLight } from './map/routeLight';
import { localTrack } from './i18n/tracks';
import { useLang, useT } from './i18n/useT';
import { useOuting } from './useOuting';
import './fonts.css';
import './components/shell/shell.css';
import './demo/demo.css';

/** Scroll a panel section into view once it has rendered, so a scenario step shows what it talks about. */
function reveal(selector: string): void {
  window.setTimeout(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    document.querySelector(selector)?.scrollIntoView({ block: 'nearest', behavior: reduced ? 'auto' : 'smooth' });
  }, 150);
}

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
function paddingFor(home: boolean, mobile: boolean, parked = false, captioned = false): PaddingOptions {
  const { innerWidth: width, innerHeight: height } = window;
  // A parked route sits in the home spotlight, clear of the orb and greeting.
  if (parked) return mobile ? { top: 110, bottom: Math.round(height * 0.38), left: 40, right: 40 } : { top: 120, bottom: 90, left: 90, right: Math.round(width * 0.46) };
  if (home) return mobile ? { top: 0, bottom: Math.round(height * 0.3), left: 0, right: 0 } : { top: 0, bottom: 0, left: 0, right: Math.round(width * 0.24) };
  // On a phone, a running demo scenario's caption covers the top of the map: keep the route below it.
  return mobile
    ? { top: captioned ? 175 : 100, bottom: Math.round(height * (captioned ? 0.4 : 0.55)), left: 30, right: 30 }
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
  const t = useT();
  const lang = useLang();
  const outing = useOuting();
  const { result, status } = outing;
  const [composing, setComposing] = useState(false);
  /** The trip panel is closed but its route stays on the home view, ready to resume. */
  const [parked, setParked] = useState(false);
  const [selectedId, setSelectedId] = useState<string>();
  const [curtain, setCurtain] = useState<Curtain>('down');
  const [introDone, setIntroDone] = useState(false);
  const [sourcesOpen, setSourcesOpen] = useState(false);
  const [map, setMap] = useState<Map | null>(null);
  const [popupPlaceId, setPopupPlaceId] = useState<string>();
  /** Toilets and defibrillators near the route: off until the visitor asks for them. */
  const [amenities, setAmenities] = useState<Set<AmenityKind>>(new Set());
  const [amenityCounts, setAmenityCounts] = useState<Record<AmenityKind, number>>({ toilets: 0, aed: 0 });
  const [spotlight, setSpotlight] = useState<HTMLDivElement | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  /** Static demo only: a place picked in the search, and the roadmap mock-up panel. */
  const [searched, setSearched] = useState<{ place: Place; sources: Source[] }>();
  const [mockTab, setMockTab] = useState<MockTab | null>(null);
  const mobile = useIsMobile();
  const [scenarioOn, setScenarioOn] = useState(false);

  const home = !result || parked;
  // The home view is a still backdrop, except while a searched place is being looked at.
  const still = home && !searched;
  const phase: AgentPhase = result && !parked ? 'result' : composing ? 'compose' : 'home';
  const accent = moodForTrack(result?.track?.id)?.accent ?? DEFAULT_ACCENT;
  const padding = paddingFor(home, mobile, parked && !!result, DEMO && scenarioOn);

  // Safety net: if tiles never load (no network), lift the curtain and show the UI anyway.
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setCurtain(current => (current === 'down' ? 'lifting' : current));
      setIntroDone(true);
    }, 6000);
    return () => window.clearTimeout(timer);
  }, []);

  // The spotlight lies directly on the map canvas: under the stop markers, pop-ups and controls,
  // which MapLibre appends after the canvas, so it darkens the city and nothing else.
  useEffect(() => {
    if (!map) return;
    const element = document.createElement('div');
    element.className = 'spotlight';
    element.setAttribute('aria-hidden', 'true');
    map.getCanvas().after(element);
    setSpotlight(element);
    return () => {
      element.remove();
      setSpotlight(null);
    };
  }, [map]);

  // Compose the opening shot around the spotlight before the intro flies in.
  useEffect(() => {
    if (map) map.setPadding(paddingFor(true, mobile));
  }, [map]);

  // Home is a still backdrop: no dragging or zooming until there is a route to explore.
  useEffect(() => {
    if (!map) return;
    const handlers = [map.dragPan, map.scrollZoom, map.boxZoom, map.dragRotate, map.keyboard, map.doubleClickZoom, map.touchZoomRotate, map.touchPitch];
    for (const handler of handlers) (still ? handler.disable() : handler.enable());
    return showPins(map, false);
  }, [map, still]);

  // On the home view the camera leans towards the mouse and the spotlight drifts with it.
  useEffect(() => {
    if (!map || !still || !introDone) return;
    return startParallax(map, {
      // A parked route keeps the angle it was fitted with (routes.ts fitRoute).
      bearing: parked ? -20 : INITIAL_VIEW.bearing,
      pitch: parked ? 55 : INITIAL_VIEW.pitch,
      onMove: (x, y) => {
        spotlight?.style.setProperty('--drift-x', `${(x * 3).toFixed(2)}%`);
        spotlight?.style.setProperty('--drift-y', `${(y * 3).toFixed(2)}%`);
      },
    });
  }, [map, still, introDone, parked, spotlight]);

  // Each new response selects its recommended route and closes the opening bubble.
  useEffect(() => {
    if (!result) return;
    setSelectedId((result.routes.find(route => route.recommended) ?? result.routes[0])?.id);
    setComposing(false);
    setParked(false);
    setPopupPlaceId(undefined);
    setSearched(undefined);
  }, [result]);

  const selectedRoute = result?.routes.find(route => route.id === selectedId);

  useEffect(() => {
    let current = true;
    void amenitiesNear(selectedRoute).then(found => {
      if (current) setAmenityCounts({ toilets: found.toilets.length, aed: found.aed.length });
    });
    return () => { current = false; };
  }, [selectedRoute]);

  function toggleAmenity(kind: AmenityKind) {
    setAmenities(previous => {
      const next = new Set(previous);
      if (next.has(kind)) next.delete(kind);
      else next.add(kind);
      return next;
    });
  }

  // With a route, light follows the route's shape instead of the round spotlight, so the corridor
  // stays lit wherever the camera goes and everything else (also under the panel) stays dim.
  useEffect(() => {
    if (!map || !spotlight || !selectedRoute) {
      spotlight?.classList.remove('spotlight--route');
      return;
    }
    spotlight.classList.add('spotlight--route');
    return startRouteLight(map, spotlight, selectedRoute);
  }, [map, selectedRoute, spotlight]);

  function selectRoute(id: string) {
    setSelectedId(id);
    setPopupPlaceId(undefined);
  }

  /** Close the trip but keep its route glowing on the home view. */
  function park() {
    setParked(true);
    setComposing(false);
    setSourcesOpen(false);
    setPopupPlaceId(undefined);
  }

  function resume() {
    setParked(false);
    setComposing(false);
  }

  /** Forget the trip entirely and return to the opening view. */
  function goHome() {
    outing.reset();
    setDetailsOpen(false);
    setAmenities(new Set());
    setSearched(undefined);
    setParked(false);
    setComposing(false);
    setSourcesOpen(false);
    setPopupPlaceId(undefined);
    setSelectedId(undefined);
  }

  // ---- Static demo: scripted scenarios and place search (src/demo/) ----
  const resultRef = useRef(result);
  resultRef.current = result;
  const routeIndex = (() => {
    const ranked = [...(result?.routes ?? [])].sort((a, b) => a.rank - b.rank);
    return Math.max(0, ranked.findIndex(route => route.id === selectedId));
  })();
  const live = useRef({ routeIndex, goHome, outing, map });
  live.current = { routeIndex, goHome, outing, map };

  const scenarioApi: ScenarioApi = {
    async home() {
      live.current.goHome();
      setMockTab(null);
      await new Promise(resolve => window.setTimeout(resolve, 500));
    },
    ask: prompt => live.current.outing.ask(prompt),
    chooseTrack: trackId => live.current.outing.chooseTrack(trackId),
    selectRoute(index) {
      const ranked = [...(resultRef.current?.routes ?? [])].sort((a, b) => a.rank - b.rank);
      if (ranked[index]) selectRoute(ranked[index].id);
    },
    showStop(which) {
      const stops = [...(resultRef.current?.routes.find(route => route.recommended)?.stops ?? [])].sort((a, b) => a.order - b.order);
      const stop = which === 'first' ? stops[0] : which === 'last' ? stops[stops.length - 1] : undefined;
      setPopupPlaceId(stop?.place_id);
    },
    setDetails(open) {
      setDetailsOpen(open);
      if (open) reveal('.trip__details');
    },
    setSources(open) {
      setSourcesOpen(open);
      if (open) reveal('#sources-drawer');
    },
    setAmenities: (toilets, aed) => setAmenities(new Set<AmenityKind>([...(toilets ? ['toilets' as const] : []), ...(aed ? ['aed' as const] : [])])),
    setMock: setMockTab,
    result: () => resultRef.current,
    selectedRouteIndex: () => live.current.routeIndex,
    async waitForAnswer(ready) {
      const before = resultRef.current;
      for (let waited = 0; waited < 15_000; waited += 100) {
        const now = resultRef.current;
        if (now && now !== before && ready(now)) {
          await new Promise(resolve => window.setTimeout(resolve, 900));
          return;
        }
        await new Promise(resolve => window.setTimeout(resolve, 100));
      }
    },
  };
  const scenario = useScenario(scenarioApi);
  const captioned = scenario.state.scenario !== undefined;
  useEffect(() => setScenarioOn(captioned), [captioned]);

  function pickSearched(place: Place, sources: Source[]) {
    scenario.stop();
    setPopupPlaceId(undefined);
    setSearched({ place, sources });
    map?.easeTo({
      center: [place.longitude, place.latitude],
      zoom: 16.2,
      pitch: 55,
      padding,
      duration: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 1400,
    });
  }

  function closeSearched() {
    setSearched(undefined);
  }

  const shellClass = ['shell', home ? 'shell--home' : 'shell--trip', introDone && 'shell--in', DEMO && 'shell--demo', captioned && 'shell--captioned'].filter(Boolean).join(' ');

  return (
    <div className={shellClass} style={{ '--accent': accent } as CSSProperties}>
      <MapView
        routes={result?.routes}
        selectedRouteId={selectedId}
        padding={padding}
        accent={result ? accent : undefined}
        locate={false}
        fitKey={parked ? 'parked' : 'trip'}
        explore={!!result && !parked}
        amenities={amenities}
        onIntroStart={() => setCurtain('lifting')}
        onIntroDone={() => setIntroDone(true)}
        onMapReady={setMap}
        onStopClick={setPopupPlaceId}
      />
      {DEMO && map && searched && (
        <SearchPopup key={searched.place.id} map={map} place={searched.place} sources={searched.sources} onClose={closeSearched} />
      )}
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
      {DEMO && (
        <>
          <DemoBar onStartScenario={scenario.start} onPickPlace={pickSearched} />
          <ScenarioCaption
            state={scenario.state}
            vars={captionVars(result, routeIndex)}
            onToggle={scenario.toggle}
            onNext={scenario.next}
            onReplay={scenario.replay}
            onStop={scenario.stop}
          />
          {mockTab && <MockupPanel tab={mockTab} onTab={setMockTab} onClose={() => { setMockTab(null); }} />}
        </>
      )}
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
        resumeTitle={parked && result ? localTrack(result.track, lang)?.title ?? selectedRoute?.name : undefined}
        onResume={resume}
        onAsk={outing.ask}
        onChooseTrack={outing.chooseTrack}
        onSelectRoute={selectRoute}
        onShowPlace={placeId => setPopupPlaceId(current => (current === placeId ? undefined : placeId))}
        onToggleSources={() => setSourcesOpen(open => !open)}
        onReset={park}
        amenities={amenities}
        amenityCounts={amenityCounts}
        onToggleAmenity={toggleAmenity}
        detailsOpen={detailsOpen}
        onToggleDetails={() => setDetailsOpen(open => !open)}
      />
      <Reports map={map} explore={!!result && !parked} />
      <p className="credits">
        <MapCredits />
        {result && (
          <>
            {` · ${t('shellTimetable')} `}
            <a href="https://ztm.waw.pl" target="_blank" rel="noreferrer">ZTM Warszawa</a>
            {`, ${t('shellGtfsBy')} `}
            <a href="https://mkuran.pl/gtfs/" target="_blank" rel="noreferrer">Mikołaj Kuranowski</a>
          </>
        )}
        {` · ${t('privacyLine')}`}
      </p>
    </div>
  );
}
