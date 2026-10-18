import type { Route } from '../api/contract';

/**
 * One glow colour per candidate route on the dark map: warm gold (brighter than the amber
 * streets), teal, violet. `tint` and `roof` light the 3D buildings in the route's corridor.
 */
const PALETTE = [
  { line: '#ffc56b', tint: '#4b443c', roof: '#6f6355' }, // gold
  { line: '#5fe0cf', tint: '#3a4747', roof: '#53706c' }, // teal
  { line: '#b9a2ff', tint: '#433f55', roof: '#62597f' }, // violet
];

export type RouteColour = (typeof PALETTE)[number];

function rankIndex(routes: Route[], routeId: string | undefined): number {
  const ranked = [...routes].sort((a, b) => a.rank - b.rank);
  return Math.max(0, ranked.findIndex(route => route.id === routeId));
}

/** Colour for `routeId` by rank (rank 1 = first colour), stable while the response is shown. */
export function routeColour(routes: Route[], routeId: string | undefined): RouteColour {
  return PALETTE[rankIndex(routes, routeId) % PALETTE.length];
}

/** Letter for `routeId` by rank (rank 1 = A), the same on the map and in the route switch. */
export function routeLetter(routes: Route[], routeId: string | undefined): string {
  return String.fromCharCode(65 + rankIndex(routes, routeId));
}

const CORRIDOR_BUILDING = '#2f3136';
const CORRIDOR_ROOF = '#4a4c54';

/** Blends two #rrggbb colours; `t` is the share of `b`. */
function mix(a: string, b: string, t: number): string {
  const channel = (hex: string, i: number) => parseInt(hex.slice(1 + i * 2, 3 + i * 2), 16);
  const blended = [0, 1, 2].map(i => Math.round(channel(a, i) * (1 - t) + channel(b, i) * t));
  return `#${blended.map(value => value.toString(16).padStart(2, '0')).join('')}`;
}

/** A route colour from a mood accent: the route glows in the accent, corridor buildings take a faint tint of it. */
export function accentColour(accent: string): RouteColour {
  return { line: accent, tint: mix(accent, CORRIDOR_BUILDING, 0.85), roof: mix(accent, CORRIDOR_ROOF, 0.72) };
}
