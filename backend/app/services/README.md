# Module ownership

Delta owns shared business logic here. REST and MCP should both call these services.

## Route planning (BE-01)

- `planner.plan(RouteRequest)` builds the whole `RouteResponse`. REST calls it; MCP must call it too.
- `routing.py`: street geometry from FOSSGIS OSRM (`routing.openstreetmap.de`, foot and bike profiles).
  Set `ROUTING_SOURCE=cache` for the pitch so committed responses in `data/fixtures/osrm-cache` are used first.
  If OSRM and the caches fail, routes become straight lines, `geometry_kind: straight_line` and response `mode: mock`.
- `scoring.py`: green and quiet scores are **proxies**, documented in each response's `sources[].method`.
  Green: share of the route in or within 20 m of an OSM park. Quiet: distance from major OSM roads. Neither is measured.
- `osm_context.py`: park polygons and major roads, committed as `data/fixtures/osm-context.json` (ODbL).
- `demo_cache.py`: refresh the committed OSRM cache after changing candidate selection.

Places come from `data/fixtures/osm-places-sample.json` (DATA-01). Museums marked closed or under renovation are skipped.
Preference interpretation falls back to keyword rules (`interpreted_by: rules`) when no model is configured.

## AI (AI-01)

`ai.py` is optional at every step. The model returns preference values (range-checked; explicit request preferences still win)
and rewords explanations from planner facts. A worded explanation with any number not in those facts is discarded,
and the template stays. No key, a timeout or a bad reply all fall back to rules, with `interpreted_by: rules`.

## Stale live data (freshness.py)

Warsaw open data and GTFS-derived feeds can go quiet for a vehicle or station (repairs, holdbacks, technical stops) while the
feed still answers 200. `freshness.py` judges each record by its own timestamp: older than 30 minutes (`MAX_AGE_S`), missing,
unreadable or dated in the future means not live. `split_live` separates live from stale records; `has_gap` flags a series that
skips more than 30 minutes. Naive feed times are read as Europe/Warsaw.

Any future live transit integration (vehicle positions, departures) must pass records through `split_live` before use:
show stale vehicles as "last seen HH:MM" or drop them, never as live; never extrapolate a position across a gap; fall back to
the schedule, labelled as schedule. Air-quality features already carry `properties.freshness` (`updated_at`, `age_s`, `fresh`,
`reason`); cached readings are therefore reported as stale, which is accurate.
## MCP (MCP-01)

`app/adapters/mcp_server.py` is a Streamable HTTP MCP server (official `mcp` SDK, stateless JSON). Its tools call
`planner.plan` and `app.db`, the same services as REST: `plan_outing`, `search_places`, `list_layers`, `get_layer`.

```bash
# MCP_TOKEN in .env (required; the server refuses to start without it)
PYTHONPATH=backend python -m app.adapters.mcp_server --host "$(tailscale ip -4)" --port 8001
MCP_URL=http://<tailscale-ip>:8001/mcp python scripts/mcp_client_demo.py "a quiet museum outing"
```

Endpoint `http://<tailscale-ip>:8001/mcp`, header `Authorization: Bearer <MCP_TOKEN>`. Bind to the Tailscale address only;
never expose it publicly. Add other Host names (for example the MagicDNS name) with `MCP_ALLOWED_HOSTS`.
Requests are stateless and nothing about the caller is stored.

## Opening hours (opening_hours.py)

`opening_hours.status(text, when)` evaluates raw OSM text to `open`, `closed` or `unknown`. It supports weekday lists and ranges,
`HH:MM-HH:MM` ranges, `off`/`closed`, `24/7` and `;` rules (later rules override earlier ones). Anything else (public holidays,
months, sunrise, a bare day list) is `unknown`: we do not guess.

The planner uses it in two places, with Warsaw time from `planner.clock()` (tests freeze it): museums that are `closed` 30 minutes
after departure are left out of the candidate pool (unknown hours stay; if none would remain, all stay), and each route's
explanation gets a sentence for museums `closed` at their estimated arrival or with unknown hours. Known limit: only the first
arrival is used to filter the pool, so a later stop can still be flagged closed. No contract field was added.

## Simulated tracks (decision call)

`tracks.py` + `data/fixtures/simulated-tracks.json`: six predefined outings (fixed catalogue stops, travel mode, priorities), all labelled `simulated: true`.

- `GET /api/tracks` lists them.
- `POST /api/tracks/run {"query": "...", "track_id": null}` makes **one** model call that returns only a track id (enum schema) and a short reason, then runs the track through `planner.plan(..., use_model=False)` as an explicit itinerary. `track_id` skips the model.
- Fallbacks: unknown id or model failure picks by keywords (English and Polish), then the first track. `track.picked_by` says `user`, `model` or `keywords`.
- The response is a normal routes response plus a `track` object. `contracts/api.schema.json` does not list `track` yet; add it with Delta and Alban's sign-off before the frontend depends on it.
- Geometry for all six tracks is in `data/fixtures/osrm-cache` (`python -m app.services.demo_cache` refreshes it), so `ROUTING_SOURCE=cache` serves street geometry offline.
- `GET /api/health` reports `capabilities.simulated_tracks`.
