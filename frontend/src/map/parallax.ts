import type { Map } from 'maplibre-gl';

/** Largest camera swing towards the cursor, in degrees. Small: a hint of depth, not a ride. */
const MAX_BEARING = 7;
const MAX_PITCH = 4;
/** Share of the remaining distance covered per frame; lower is softer. */
const EASE = 0.06;

interface ParallaxOptions {
  bearing: number;
  pitch: number;
  /** Called every frame with the eased cursor position, -1..1 on each axis (e.g. to move a spotlight). */
  onMove?: (x: number, y: number) => void;
}

/**
 * Tilts the camera a few degrees towards the mouse, eased, and stops drawing once it settles.
 * Mouse only: touch, pen and reduced motion get a still map. Returns a function that stops it.
 */
export function startParallax(map: Map, { bearing, pitch, onMove }: ParallaxOptions): () => void {
  const finePointer = window.matchMedia('(pointer: fine)').matches;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!finePointer || reduced) return () => {};

  const target = { x: 0, y: 0 };
  const current = { x: 0, y: 0 };
  let frame = 0;
  // Never interrupt a camera flight (the intro, or fitting a route); lean in once it lands.
  // Our own jumpTo fires its move events synchronously, so `own` tells them apart.
  let own = false;
  let flying = map.isMoving(); // a flight may already be under way when this starts
  const onMoveStart = () => { if (!own) flying = true; };
  const onMoveEnd = () => { if (!own) flying = false; };
  map.on('movestart', onMoveStart);
  map.on('moveend', onMoveEnd);

  const step = () => {
    if (flying) {
      frame = requestAnimationFrame(step);
      return;
    }
    current.x += (target.x - current.x) * EASE;
    current.y += (target.y - current.y) * EASE;
    own = true;
    map.jumpTo({ bearing: bearing + current.x * MAX_BEARING, pitch: pitch - current.y * MAX_PITCH });
    own = false;
    onMove?.(current.x, current.y);
    const settled = Math.abs(target.x - current.x) < 0.002 && Math.abs(target.y - current.y) < 0.002;
    frame = settled ? 0 : requestAnimationFrame(step);
  };

  const onPointerMove = (event: PointerEvent) => {
    if (event.pointerType !== 'mouse') return;
    target.x = (event.clientX / window.innerWidth) * 2 - 1;
    target.y = (event.clientY / window.innerHeight) * 2 - 1;
    if (!frame) frame = requestAnimationFrame(step);
  };

  window.addEventListener('pointermove', onPointerMove);
  return () => {
    window.removeEventListener('pointermove', onPointerMove);
    map.off('movestart', onMoveStart);
    map.off('moveend', onMoveEnd);
    cancelAnimationFrame(frame);
  };
}
