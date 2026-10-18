import type { Map, PaddingOptions } from 'maplibre-gl';
import { useEffect, useRef } from 'react';
import type { Route } from '../api/contract';
import { loadPins } from '../data';
import { addPins } from '../markers/pins';
import { INITIAL_VIEW } from './config';
import { createMap } from './createMap';
import { INTRO_START, locateVisitor, markVisitor, playIntro, retargetIntro } from './intro';
import { accentColour, routeColour } from './routeColours';
import { initCorridor, showCorridor } from './corridor';
import { initRouteFocus } from './routeFocus';
import { fitRoute, onStopClick, showRoutes } from './routes';

interface MapViewProps {
  routes?: Route[];
  selectedRouteId?: string;
  /** Space the floating panels cover, so a fitted route stays visible. */
  padding?: PaddingOptions;
  /** Map is ready and the intro is starting: the black curtain can lift. */
  onIntroStart?: () => void;
  /** Intro finished; `located` is false when it landed on the central-Warsaw fallback. */
  onIntroDone?: (located: boolean) => void;
  /** The map instance, once created (for pop-ups anchored to places). */
  onMapReady?: (map: Map | null) => void;
  /** A numbered stop marker was clicked. */
  onStopClick?: (placeId: string) => void;
  /** Ask for the visitor's location and fly there. Off when the home view is composed around a fixed spot. */
  locate?: boolean;
  /** Mood colour for the selected route's glow and corridor; rank colours otherwise. */
  accent?: string;
  /** Changing it refits the selected route with the current padding (e.g. trip ⇄ parked on home). */
  fitKey?: string;
}

// Stable default, so the route effects don't rerun (and refit the camera) on every render.
const NO_ROUTES: Route[] = [];

/** Thin React wrapper: the map itself lives in framework-free modules. */
export function MapView({ routes = NO_ROUTES, selectedRouteId, padding, onIntroStart, onIntroDone, onMapReady, onStopClick: onStop, locate = true, accent, fitKey }: MapViewProps) {
  const container = useRef<HTMLDivElement>(null);
  const mapRef = useRef<Map | null>(null);
  const callbacks = useRef({ onIntroStart, onIntroDone, onMapReady, onStop });
  callbacks.current = { onIntroStart, onIntroDone, onMapReady, onStop };

  useEffect(() => {
    const map = createMap(container.current!, INTRO_START);
    mapRef.current = map;
    callbacks.current.onMapReady?.(map);
    onStopClick(map, placeId => callbacks.current.onStop?.(placeId));
    // Dev-only handle for the browser console and automated checks.
    if (import.meta.env.DEV) Object.assign(window, { warsawMap: map });
    const abort = new AbortController();
    const location = locate ? locateVisitor() : Promise.resolve(null);
    loadPins(undefined, abort.signal)
      .then(pins => !abort.signal.aborted && addPins(map, pins))
      .catch(error => console.warn('Loading pins failed', error));
    map.once('load', () => {
      // Buildings rise with zoom during the intro, and later sink away from the selected route.
      initRouteFocus(map);
      initCorridor(map);
      // Don't wait for a location prompt: fly to central Warsaw now, and re-target if a position arrives.
      let landed = false;
      let located = false;
      callbacks.current.onIntroStart?.();
      playIntro(map, INITIAL_VIEW.center, () => {
        landed = true;
        callbacks.current.onIntroDone?.(located);
      });
      void location.then(point => {
        if (!point || abort.signal.aborted) return;
        located = true;
        markVisitor(map, point);
        retargetIntro(map, point, landed);
        if (landed) callbacks.current.onIntroDone?.(true);
      });
    });
    // Cleanup also makes React StrictMode's double mount safe.
    return () => {
      abort.abort();
      mapRef.current = null;
      callbacks.current.onMapReady?.(null);
      map.remove();
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    showRoutes(map, routes, selectedRouteId, accent);
    const selected = routes.find(route => route.id === selectedRouteId);
    showCorridor(map, selected, selected && (accent ? accentColour(accent) : routeColour(routes, selected.id)));
  }, [routes, selectedRouteId, accent]);

  // Fit the camera when a new set of routes arrives or the selection changes.
  useEffect(() => {
    const map = mapRef.current;
    const route = routes.find(candidate => candidate.id === selectedRouteId);
    if (map && route && padding) fitRoute(map, route, padding);
    // Back home: return to the opening view (padding keeps it composed around the spotlight).
    else if (map && routes.length === 0 && map.loaded()) map.easeTo({ ...INITIAL_VIEW, ...(padding && { padding }), duration: 900 });
    // padding is recomputed each render on purpose: only routes, selection or fitKey move the camera.
  }, [routes, selectedRouteId, fitKey]);

  return <div ref={container} className="map" />;
}
