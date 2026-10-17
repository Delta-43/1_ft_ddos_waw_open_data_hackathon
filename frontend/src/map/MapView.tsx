import type { Map, PaddingOptions } from "maplibre-gl";
import { useEffect, useRef, useState } from "react";
import type { Route } from "../api/contract";
import { loadPins } from "../data";
import { addPins } from "../markers/pins";
import { INITIAL_VIEW } from "./config";
import { createMap } from "./createMap";
import { focusRoute, initRouteFocus } from "./routeFocus";
import { fitRoute, onStopClick, showRoutes } from "./routes";
import { applyAppearance } from "./appearance";
interface Props {
  routes?: Route[];
  selectedRouteId?: string;
  padding?: PaddingOptions;
  onMapReady?: (map: Map | null) => void;
  onStopClick?: (id: string) => void;
  appearance?: string;
}
const NO_ROUTES: Route[] = [];
export function MapView({
  routes = NO_ROUTES,
  selectedRouteId,
  padding,
  onMapReady,
  onStopClick: onStop,
  appearance,
}: Props) {
  const container = useRef<HTMLDivElement>(null),
    ref = useRef<Map | null>(null);
  const callbacks = useRef({ onMapReady, onStop });
  callbacks.current = { onMapReady, onStop };
  const [ready, setReady] = useState(false),
    [failed, setFailed] = useState(false);
  useEffect(() => {
    let map: Map;
    try {
      map = createMap(container.current!, {
        ...INITIAL_VIEW,
        center: [21.031, 52.218],
        zoom: 13.8,
        pitch: 40,
      });
    } catch {
      setFailed(true);
      return;
    }
    ref.current = map;
    const abort = new AbortController();
    if (import.meta.env.DEV) Object.assign(window, { warsawMap: map });
    onStopClick(map, (id) => callbacks.current.onStop?.(id));
    const timeout = window.setTimeout(() => setFailed(true), 15000);
    map.once("load", () => {
      clearTimeout(timeout);
      setFailed(false);
      initRouteFocus(map);
      applyAppearance(map);
      setReady(true);
      callbacks.current.onMapReady?.(map);
    });
    loadPins(undefined, abort.signal)
      .then((pins) => {
        if (!abort.signal.aborted) addPins(map, pins);
      })
      .catch(() => {});
    return () => {
      clearTimeout(timeout);
      abort.abort();
      ref.current = null;
      callbacks.current.onMapReady?.(null);
      map.remove();
    };
  }, []);
  useEffect(() => {
    const map = ref.current;
    if (!map || !ready) return;
    showRoutes(map, routes, selectedRouteId);
    focusRoute(
      map,
      routes.find((r) => r.id === selectedRouteId),
    );
    applyAppearance(map);
  }, [ready, routes, selectedRouteId]);
  useEffect(() => {
    const map = ref.current,
      route = routes.find((r) => r.id === selectedRouteId);
    if (map && ready && route && padding) {
      const frame = requestAnimationFrame(() => {
        map.resize();
        fitRoute(map, route, padding);
      });
      return () => cancelAnimationFrame(frame);
    }
  }, [ready, routes, selectedRouteId, padding]);
  useEffect(() => {
    if (ref.current && ready) applyAppearance(ref.current);
  }, [appearance, ready]);
  return (
    <>
      <div
        ref={container}
        className="map"
        role="region"
        aria-label="Interactive Warsaw map"
      />
      {failed && (
        <p className="map-failure" role="status">
          Map tiles are unavailable. You can still plan and explore the route
          list.
        </p>
      )}
    </>
  );
}
