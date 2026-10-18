import type { Route } from '../api/contract';

/**
 * One glow colour per candidate route on the dark map: warm gold (brighter than the amber
 * streets), teal, violet. `tint` and `roof` colour the 3D buildings in the route's corridor:
 * plain grey for every route, so only the route itself carries the colour.
 */
const CORRIDOR_BUILDING = '#353539';
const CORRIDOR_ROOF = '#57575d';
const PALETTE = [
  { line: '#ffc56b', tint: CORRIDOR_BUILDING, roof: CORRIDOR_ROOF }, // gold
  { line: '#5fe0cf', tint: CORRIDOR_BUILDING, roof: CORRIDOR_ROOF }, // teal
  { line: '#b9a2ff', tint: CORRIDOR_BUILDING, roof: CORRIDOR_ROOF }, // violet
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

/** A route colour from a mood accent: the route glows in the accent, corridor buildings stay grey. */
export function accentColour(accent: string): RouteColour {
  return { line: accent, tint: CORRIDOR_BUILDING, roof: CORRIDOR_ROOF };
}
