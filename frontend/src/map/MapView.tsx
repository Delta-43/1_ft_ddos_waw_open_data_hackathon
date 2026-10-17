import type { Map, PaddingOptions } from 'maplibre-gl';
import { useEffect, useRef } from 'react';
import type { Route } from '../api/contract';
import { loadPins } from '../data';
import { addPins } from '../markers/pins';
import { INITIAL_VIEW } from './config';
import { createMap } from './createMap';
import { INTRO_START, growBuildingsWithZoom, locateVisitor, markVisitor, playIntro } from './intro';
import { fitRoute, showRoutes } from './routes';

interface MapViewProps {
  routes?: Route[];
  selectedRouteId?: string;
  /** Space the floating panels cover, so a fitted route stays visible. */
  padding?: PaddingOptions;
  /** Map is ready and the intro is starting: the black curtain can lift. */
  onIntroStart?: () => void;
  /** Intro finished; `located` is false when it landed on the central-Warsaw fallback. */
  onIntroDone?: (located: boolean) => void;
}

// Stable default, so the route effects don't rerun (and refit the camera) on every render.
const NO_ROUTES: Route[] = [];

/** Thin React wrapper: the map itself lives in framework-free modules. */
export function MapView({ routes = NO_ROUTES, selectedRouteId, padding, onIntroStart, onIntroDone }: MapViewProps) {
  const container = useRef<HTMLDivElement>(null);
  const mapRef = useRef<Map | null>(null);
  const callbacks = useRef({ onIntroStart, onIntroDone });
  callbacks.current = { onIntroStart, onIntroDone };

  useEffect(() => {
    const map = createMap(container.current!, INTRO_START);
    mapRef.current = map;
    // Dev-only handle for the browser console and automated checks.
    if (import.meta.env.DEV) Object.assign(window, { warsawMap: map });
    const abort = new AbortController();
    const location = locateVisitor();
    loadPins(undefined, abort.signal)
      .then(pins => !abort.signal.aborted && addPins(map, pins))
      .catch(error => console.warn('Loading pins failed', error));
    map.once('load', async () => {
      growBuildingsWithZoom(map);
      const point = await location;
      if (abort.signal.aborted) return;
      callbacks.current.onIntroStart?.();
      if (point) markVisitor(map, point);
      playIntro(map, point ?? INITIAL_VIEW.center, () => callbacks.current.onIntroDone?.(point !== null));
    });
    // Cleanup also makes React StrictMode's double mount safe.
    return () => {
      abort.abort();
      mapRef.current = null;
      map.remove();
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (map) showRoutes(map, routes, selectedRouteId);
  }, [routes, selectedRouteId]);

  // Fit the camera when a new set of routes arrives or the selection changes.
  useEffect(() => {
    const map = mapRef.current;
    const route = routes.find(candidate => candidate.id === selectedRouteId);
    if (map && route && padding) fitRoute(map, route, padding);
    // padding is recomputed each render on purpose: only routes or selection move the camera.
  }, [routes, selectedRouteId]);

  return <div ref={container} className="map" />;
}
