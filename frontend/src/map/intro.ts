import { Marker, type LngLatLike, type Map } from 'maplibre-gl';
import { getLang } from '../i18n/language';
import { translate } from '../i18n/translations';
import { CAMERA_LIMITS, INITIAL_VIEW } from './config';

/** The camera the intro starts from: high above Warsaw, looking straight down. */
export const INTRO_START = { center: INITIAL_VIEW.center, zoom: 10.5, pitch: 0, bearing: 0 };

/** CSS-style cubic-bezier easing, so the camera matches the UI's cubic-bezier(.6,0,.05,1). */
function cubicBezier(x1: number, y1: number, x2: number, y2: number): (t: number) => number {
  const at = (a: number, b: number, t: number) => 3 * a * t * (1 - t) ** 2 + 3 * b * t ** 2 * (1 - t) + t ** 3;
  return (x: number) => {
    let lo = 0;
    let hi = 1;
    for (let i = 0; i < 24; i++) {
      const mid = (lo + hi) / 2;
      if (at(x1, x2, mid) < x) lo = mid;
      else hi = mid;
    }
    return at(y1, y2, (lo + hi) / 2);
  };
}
const easeSignature = cubicBezier(0.6, 0, 0.05, 1);

const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function insideWarsaw([lng, lat]: [number, number]): boolean {
  const [[minLng, minLat], [maxLng, maxLat]] = CAMERA_LIMITS.maxBounds as [[number, number], [number, number]];
  return lng >= minLng && lng <= maxLng && lat >= minLat && lat <= maxLat;
}

/**
 * The visitor's position, or null. Browsers only offer location on HTTPS or localhost,
 * so the shared demo (plain HTTP) always lands on the central-Warsaw fallback.
 * The position stays in the browser; nothing here sends or stores it.
 */
export function locateVisitor(timeoutMs = 4000): Promise<[number, number] | null> {
  if (!window.isSecureContext || !('geolocation' in navigator)) return Promise.resolve(null);
  return new Promise(resolve => {
    const timer = window.setTimeout(() => resolve(null), timeoutMs);
    navigator.geolocation.getCurrentPosition(
      position => {
        window.clearTimeout(timer);
        const point: [number, number] = [position.coords.longitude, position.coords.latitude];
        resolve(insideWarsaw(point) ? point : null);
      },
      () => {
        window.clearTimeout(timer);
        resolve(null);
      },
      { timeout: timeoutMs, maximumAge: 600_000 },
    );
  });
}

/** Flies from INTRO_START down to street level over `target`, then calls `done`. */
export function playIntro(map: Map, target: LngLatLike, done: () => void): void {
  const view = { center: target, zoom: INITIAL_VIEW.zoom, pitch: INITIAL_VIEW.pitch, bearing: INITIAL_VIEW.bearing };
  if (reducedMotion()) {
    map.jumpTo(view);
    done();
    return;
  }
  map.once('moveend', done);
  map.flyTo({ ...view, duration: 2500, easing: easeSignature, essential: true });
}

/** Re-aims the intro (or a finished intro) at the visitor, ending at the same street-level view. */
export function retargetIntro(map: Map, target: LngLatLike, landed: boolean): void {
  const view = { center: target, zoom: INITIAL_VIEW.zoom, pitch: INITIAL_VIEW.pitch, bearing: INITIAL_VIEW.bearing };
  if (reducedMotion()) {
    map.jumpTo(view);
    return;
  }
  map.flyTo({ ...view, duration: landed ? 1200 : 2500, easing: easeSignature, essential: true });
}

/** A glowing "You are here" dot; glow marks data, and this is the visitor's own position. */
export function markVisitor(map: Map, point: [number, number]): Marker {
  const dot = document.createElement('div');
  dot.className = 'you-are-here';
  dot.setAttribute('role', 'img');
  dot.setAttribute('aria-label', translate(getLang(), 'youAreHere'));
  return new Marker({ element: dot }).setLngLat(point).addTo(map);
}
