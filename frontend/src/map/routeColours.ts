import type { Route } from '../api/contract';

/**
 * One colour per candidate route, after Delta's mockup (mockups/warsaw-2076): green, blue, brown.
 * `tint` is the pale version used for the 3D buildings in the route's corridor.
 */
const PALETTE = [
  { line: '#3d6b50', tint: '#cfdccf', roof: '#e3ebe2' }, // green
  { line: '#5b6f94', tint: '#cbd3e2', roof: '#e0e5ee' }, // blue
  { line: '#94603f', tint: '#e6d3c5', roof: '#f1e5dc' }, // brown
];

export type RouteColour = (typeof PALETTE)[number];

/** Colour for `routeId` by rank (rank 1 = first colour), stable while the response is shown. */
export function routeColour(routes: Route[], routeId: string | undefined): RouteColour {
  const ranked = [...routes].sort((a, b) => a.rank - b.rank);
  const index = Math.max(0, ranked.findIndex(route => route.id === routeId));
  return PALETTE[index % PALETTE.length];
}
