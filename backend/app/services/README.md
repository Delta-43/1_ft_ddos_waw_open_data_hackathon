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
