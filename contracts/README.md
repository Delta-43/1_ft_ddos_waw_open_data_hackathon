# Shared contract (version 1.0)

Delta and Alban jointly approve changes here before either pair implements them. Change the schema, fixtures, backend tests and `frontend/src/api/contract.ts` in the same PR.

- Schema: `api.schema.json` (JSON Schema 2020-12). Each request or response is a definition under `$defs`.
- Fixtures: `../data/fixtures/route-response.json` and `../data/fixtures/places-response.json`. Both are labelled `mock`.
- TypeScript types: `../frontend/src/api/contract.ts`.
- Units: GeoJSON order is longitude, latitude (WGS84). Distances in metres, durations in seconds, timestamps ISO 8601 with an offset.
- `GET /api/health` → `{ "status": "ok", "mode": "fixture" }` in the starter.
- `POST /api/routes` accepts `{ "query": "A quiet museum outing" }`; query is 1–1000 characters. Invalid requests return HTTP 422 using FastAPI's standard `detail` validation response.
- Frontend must handle non-2xx responses and unreachable backend.
- Keep fixtures and backend checks updated in the same PR as contract changes.
- Privacy: requests carry no user identifiers or stored-profile references, and the backend does not persist request bodies. Any future personal context is sent per request with a scoped token and is never stored.

## Endpoints

| Method and path | Request | Success response |
| --- | --- | --- |
| `GET /api/health` | None | `{ "status": "ok", "mode": "fixture", "contract_version": "1.0" }` |
| `POST /api/routes` | `RouteRequest` | `RouteResponse` |
| `GET /api/places` | Query: `category` (`museum`, `landmark`, `park`, `generic`), `bbox=min_lon,min_lat,max_lon,max_lat`, `q` (case-insensitive name/address match, trimmed, 1–100 characters), `limit` 1–100 (default 50) | `PlacesResponse` |

Invalid requests return HTTP 422 with FastAPI's standard `detail` body. The frontend must also handle other non-2xx responses and an unreachable backend.

## RouteRequest

```json
{
  "query": "A quiet, green museum afternoon",
  "preferences": {
    "interests": ["museums"],
    "travel_mode": "walk",
    "max_duration_s": 10800,
    "priorities": { "quiet": 0.8, "green": 0.8 },
    "start": { "longitude": 21.0122, "latitude": 52.2297 }
  }
}
```

- `query` is required, 1–1000 characters. Everything in `preferences` is optional.
- `travel_mode`: `walk` or `bike`. `max_duration_s`: 900–28800. Priorities: 0 (ignore) to 1 (most important).
- Unknown fields are rejected with 422, at every level.
- `destination_place_id` and `via_place_ids` (#85, steps 1-3 of 4): optional catalogue place ids (`GET /api/places`'s `id`, e.g. `osm:node/123`). `via_place_ids` is an ordered list of 0–5 unique ids, visited before `destination_place_id`, which must not also appear in it. Unknown ids, duplicates, or more than 5 stops return 422. When `destination_place_id` is set, the response is a single route (`routes` has one entry) that visits the via stops in the given order and ends at the destination — real street geometry from OSRM (or a labelled straight-line fallback), never a museum-outing template; its `places[].source_id` points at a new `osm-places-demo` entry in `sources[]` (the same catalogue `GET /api/places` reads), not the museum-outing candidates' `osm-places` entry. Closed or unknown opening hours (checked for every stop, not just museums — any of the user's own picks may carry a real `opening_hours` tag) and an itinerary that runs over the requested `max_duration_s` are stated in the route's `explanation`, never silently dropped. **Not yet done**: there's no separate no-feasible-route outcome when the budget can't be met (it's reported, not enforced as a hard failure), and no `applied_itinerary` field yet to let the UI confirm what was honoured (#85 step 4) — gate structured itinerary submission on `GET /api/health`'s future `capabilities.ordered_stops`, not on these fields being accepted. `comment` (0–500 characters) may only influence preference reading, never geometry, hours or facts, and is never stored or logged.

## RouteResponse

- `mode` and `notice`: overall data origin and a banner the UI always shows.
- `preferences`: what the backend understood, with `interpreted_by` set to `fixture`, `rules` or `model`. Forms can show it back to the user.
- `routes`: 1–3 candidates. `rank` 1 is the best match and exactly one has `recommended: true`.
  - `geometry` is a GeoJSON LineString. `geometry_kind` is `street` (from a routing service) or `straight_line` (illustrative; the UI must say so).
  - `metrics`: `distance_m`, `duration_s`, `green_score` and `quiet_score` (0–1, higher is better). Each is `{ "value", "source_id" }`, and `value` is `null` when unknown.
  - `stops`: visit order, with optional arrival offset and visit duration in seconds.
  - `places`: the place cards for this route.
  - `explanation`: short text grounded only in this response's metrics and places.
- `sources`: provenance for every `source_id`. `mode` is `real`, `historical`, `proxy` or `simulated`; `attribution` must be shown; `method` explains proxies and simulations.

## Place

`id`, `name`, `longitude`, `latitude`, `category` and `source_id` are always present. `opening_hours` is the raw OSM text or `null` when unknown; never fill it in. `summary`, `address` and `website` are optional and may be `null`. OSM IDs look like `osm:node/123`; fixtures use `fixture:<slug>`.

## Privacy

Requests carry no user identifiers or profile references, and the backend does not store or log request bodies. Future personal context is sent per request with a short-lived scoped token and is never stored. See IDEA.md, Privacy and security.

## Compatibility

Additive changes (new optional fields) need agreement but no version bump. Removing or renaming a field, or changing a type, bumps `contract_version` and must update both sides in one PR.

## City-data store and layers (additive, not part of contract 1.0 schema)

- `GET /api/places` now reads the SQLite store `data/local/city.db` (built automatically from fixtures on first request; `python -m app.db` rebuilds). Response shape is unchanged.
- `GET /api/places?q=...` (#84): optional case-insensitive name/address search, trimmed to 1–100 characters; blank or over-length values are rejected with 422. Matches catalogue places only, not a geocoder. No third-party dependency; folds Unicode case (so Polish diacritics match) in Python rather than SQLite's ASCII-only `LOWER()`. Query text is not persisted or logged. Response shape (`PlacesResponse`) is unchanged, so not yet reflected in `api.schema.json` — needs Delta + Alban sign-off per #84 before being added there and to `frontend/src/api/contract.ts`. The MCP `search_places` tool takes the same `q` parameter.
- `GET /api/layers` lists open-data layers: `air_quality`, `aed`, `toilets`, `events`, with feature counts.
- `GET /api/layers/{layer}?bbox=min_lon,min_lat,max_lon,max_lat&limit=200` returns a GeoJSON `FeatureCollection` (lon, lat) that MapLibre can use as a source directly. Source `mode` is a contract SourceMode (`real`); the envelope `mode` stays `cached`. Each feature has `properties.name`, `layer`, `source_id` plus layer-specific fields; `sources[]` carries attribution, mode (`cached`) and retrieval time for the source label.
- Until the full Warsaw cache exists in `data/local`, layers hold only the committed samples (8 features each); `sources[].method` says so.
- Needs Delta + Alban sign-off before being added to `api.schema.json`.
