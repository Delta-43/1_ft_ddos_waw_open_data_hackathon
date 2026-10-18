# Development

How to run Find YOUR way without Docker, check it, and rebuild its data. To just run it, use Docker:
see the [README](../README.md#run-it-with-docker).

## Prerequisites

Python 3.12, Node.js 22 and pnpm 11.25.0 (`npm install --global pnpm@11.25.0`). On Windows, use WSL2 or the
PowerShell variants below.

## Backend

From the repository root:

```bash
python3.12 -m venv .venv
source .venv/bin/activate            # PowerShell: .venv\Scripts\Activate.ps1
python -m pip install -r backend/requirements.txt
cp .env.example .env                 # optional settings, see below
python -m uvicorn app.main:app --app-dir backend --host 127.0.0.1 --port 8000 --reload
```

API documentation: http://127.0.0.1:8000/docs. The backend reads `.env` at start-up; existing environment
variables win. Keys stay on the backend; never put them in `VITE_` variables.

| Endpoint | Purpose |
| --- | --- |
| `GET /api/health` | Status, contract version and capabilities |
| `POST /api/tracks/run` | `{query}`: one model call picks a predefined outing, the planner routes it. `{query, track_id}` forces one |
| `GET /api/tracks` | The six predefined outings |
| `POST /api/routes` | Plans from a request and preferences directly (contract 1.0), with optional destination and ordered stops |
| `GET /api/places?q=` | Searches the place catalogue |
| `GET /api/layers`, `/api/layers/{layer}` | City data layers (Warsaw open-data samples) |

| Setting (`.env`) | Default | Effect |
| --- | --- | --- |
| `OPENROUTER_API_KEY` | empty | Without it, outings are picked by keyword match and explanations come from templates |
| `LLM_MODEL` | `anthropic/claude-haiku-5.5` | OpenRouter model; per-task overrides `LLM_MODEL_INTERPRET`, `LLM_MODEL_EXPLAIN` |
| `LLM_DATA_COLLECTION` | `deny` | Free OpenRouter models need `allow` (the provider may train on the query text) |
| `ROUTING_SOURCE` | `live` (Docker: `cache`) | `cache` serves the committed street routes in `data/fixtures/osrm-cache` first |
| `MCP_TOKEN` | empty | Bearer token for the MCP server (required to start it) |

## Frontend

```bash
cd frontend
pnpm install --frozen-lockfile
pnpm dev                              # http://127.0.0.1:5173, /api is proxied to 127.0.0.1:8000
```

To use another backend: `API_PROXY_TARGET=http://HOST:8000 pnpm dev` (PowerShell:
`$env:API_PROXY_TARGET="http://HOST:8000"; pnpm dev`). Browser code always uses relative `/api` URLs.
The dev server keeps an explicit host allow-list in `vite.config.ts`; never set `allowedHosts` to true.

URL options:

| Option | Effect |
| --- | --- |
| `?time=HH:MM` | Pins the clock for buses, trams and departures (the timetable cache is for 18 October 2026) |
| `?mock` | A labelled mock response with three straight-line routes, no backend needed |

In development, `window.warsawMap` exposes the MapLibre map in the browser console.

## Checks

```bash
ruff check backend
PYTHONPATH=backend python -m pytest backend/tests -q
cd frontend && pnpm run check && pnpm run build
docker compose config --quiet          # the container files
```

CI runs the backend and frontend checks on every pull request. `pnpm install --frozen-lockfile` must pass on a
clean clone; commit lockfile changes with the dependency change.

## Rebuilding the data

The frontend's map data is committed, so nothing needs rebuilding to run the app. To refresh it, start the
backend first: the scripts ask it for the six outings.

```bash
# 3D corridor, parks, trees, toilets, AEDs, shops, culture facts and Wikipedia summaries (Overpass + Wikipedia)
python scripts/build_corridor_cache.py http://127.0.0.1:8000
python scripts/build_corridor_cache.py --wiki-only      # summaries only

# Timetable for one day, then the car-free examples (download https://mkuran.pl/gtfs/warsaw.zip first)
python scripts/build_transit_cache.py warsaw.zip http://127.0.0.1:8000 2026-10-18
python scripts/build_transit_examples.py warsaw.zip http://127.0.0.1:8000 2026-10-18 11:00

# Street routes for every candidate and outing, written to data/fixtures/osrm-cache
PYTHONPATH=backend python -m app.services.demo_cache
```

The timetable cache covers one service day: rebuild both transit files for another date.

## MCP

The MCP server exposes the same planner to AI agents (tools: `plan_outing`, `search_places`, `list_layers`,
`get_layer`). It refuses to start without `MCP_TOKEN`; keep it on a private network.

```bash
MCP_TOKEN=... PYTHONPATH=backend python -m app.adapters.mcp_server --host 127.0.0.1 --port 8001
# or with Docker: docker compose --profile mcp up -d --build   (MCP_TOKEN in .env)
MCP_URL=http://127.0.0.1:8001/mcp MCP_TOKEN=... python scripts/mcp_client_demo.py "a quiet museum outing"
```

## Rules worth keeping

- Coordinates are `[longitude, latitude]`; distances in metres; durations in seconds; dates with offsets.
- The model interprets requests and words explanations; it never invents geometry, places or opening hours.
- Every number in the UI keeps its source label (Real, Proxy, Simulated, Cached, Historical).
- The backend stores no user data. Personal state (reports, language) stays in the browser.
