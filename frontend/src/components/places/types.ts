/**
 * A stop on a route, mirroring `routes[].places[]` in contracts/route.schema.json.
 * Coordinates are WGS84 degrees. Replace with the shared API type once src/api exports one.
 */
export interface Place {
  id: string;
  name: string;
  longitude: number;
  latitude: number;
}
