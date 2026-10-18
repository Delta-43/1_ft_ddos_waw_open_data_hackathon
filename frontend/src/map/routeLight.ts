import type { Map } from 'maplibre-gl';
import type { Route } from '../api/contract';

/**
 * Light that follows the route: a dark veil over the map with a soft band cut out along the
 * route's own shape, so the corridor stays lit at any zoom, pan or tilt, and everything else
 * (also under the panel) stays dim. Drawn on a small 2D canvas over the map canvas; it redraws
 * only when the camera moves.
 */
const VEIL = 'rgba(6, 6, 7, 0.84)';
/** Half-width of the fully lit band, in metres (the 3D corridor is 200 m). */
const LIT_M = 230;
/**
 * Soft edge: cut-outs from 2.2x down to 1x the lit width, each erasing just enough that the veil
 * fades evenly from the outside in. Ten steps keep the bands invisible. [width factor, opacity]
 */
const STEPS = 10;
const PASSES: [number, number][] = Array.from({ length: STEPS }, (_, i) => [
  1 + 1.2 * (1 - i / (STEPS - 1)),
  1 - (1 - (i + 1) / STEPS) / (1 - i / STEPS),
]);
const M_PER_DEG_LNG = 111_320 * Math.cos((52.22 * Math.PI) / 180);
/** Skip route points closer than this on screen, in pixels. */
const MIN_STEP_PX = 6;

/** Starts lighting `route` on a canvas placed after `anchor`; returns a function that removes it. */
export function startRouteLight(map: Map, anchor: HTMLElement, route: Route): () => void {
  const canvas = document.createElement('canvas');
  canvas.className = 'route-light';
  canvas.setAttribute('aria-hidden', 'true');
  anchor.after(canvas);
  const mask = document.createElement('canvas');
  const context = canvas.getContext('2d')!;
  const maskContext = mask.getContext('2d')!;
  const coordinates = route.geometry.coordinates;
  let frame = 0;

  const draw = () => {
    frame = 0;
    // The veil is soft, so CSS pixels are enough even on high-density screens.
    const { clientWidth: width, clientHeight: height } = map.getCanvas();
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = mask.width = width;
      canvas.height = mask.height = height;
    }
    // Screen points with their local lit half-width (perspective makes far parts narrower).
    const points: { x: number; y: number; r: number }[] = [];
    for (const [lng, lat] of coordinates) {
      const p = map.project([lng, lat]);
      const last = points[points.length - 1];
      if (last && Math.hypot(p.x - last.x, p.y - last.y) < MIN_STEP_PX) continue;
      const q = map.project([lng + LIT_M / M_PER_DEG_LNG, lat]);
      points.push({ x: p.x, y: p.y, r: Math.hypot(q.x - p.x, q.y - p.y) });
    }

    context.globalCompositeOperation = 'source-over';
    context.globalAlpha = 1;
    context.clearRect(0, 0, width, height);
    context.fillStyle = VEIL;
    context.fillRect(0, 0, width, height);
    maskContext.lineCap = 'round';
    maskContext.lineJoin = 'round';
    maskContext.strokeStyle = '#000';
    for (const [factor, opacity] of PASSES) {
      // Each pass is drawn opaque on its own (so overlapping joints don't add up), then
      // erased from the veil at the pass's opacity.
      maskContext.clearRect(0, 0, width, height);
      for (let i = 1; i < points.length; i++) {
        const [a, b] = [points[i - 1], points[i]];
        maskContext.lineWidth = (a.r + b.r) * factor;
        maskContext.beginPath();
        maskContext.moveTo(a.x, a.y);
        maskContext.lineTo(b.x, b.y);
        maskContext.stroke();
      }
      context.globalCompositeOperation = 'destination-out';
      context.globalAlpha = opacity;
      context.drawImage(mask, 0, 0);
    }
  };

  const schedule = () => { if (!frame) frame = requestAnimationFrame(draw); };
  draw();
  map.on('move', schedule);
  map.on('resize', schedule);
  return () => {
    map.off('move', schedule);
    map.off('resize', schedule);
    cancelAnimationFrame(frame);
    canvas.remove();
  };
}
