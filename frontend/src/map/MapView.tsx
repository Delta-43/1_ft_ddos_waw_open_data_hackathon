import { useEffect, useRef } from 'react';
import { loadPins } from '../data';
import { addPins } from '../markers/pins';
import { samplePins } from '../markers/samplePins';
import { createMap } from './createMap';

/** Thin React wrapper: the map itself lives in framework-free modules. */
export function MapView() {
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const map = createMap(container.current!);
    // Dev-only handle for the browser console and automated checks.
    if (import.meta.env.DEV) Object.assign(window, { warsawMap: map });
    const abort = new AbortController();
    addPins(map, samplePins);
    loadPins(undefined, abort.signal)
      .then(pins => !abort.signal.aborted && addPins(map, pins))
      .catch(error => console.warn('Loading pins failed', error));
    // Cleanup also makes React StrictMode's double mount safe.
    return () => {
      abort.abort();
      map.remove();
    };
  }, []);

  return <div ref={container} className="map" />;
}
