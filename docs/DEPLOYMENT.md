# Container stack

Delta runs this on shared hosts (silver-storm now, delta-server for the demo). Teammates do not need Docker: they use the URL Delta supplies.

One image (`Dockerfile`) serves both processes. `compose.yaml` starts them:

| Service | Port | Start |
| --- | --- | --- |
| `web` (built frontend on nginx, forwards `/api`) | `WEB_PORT`, default 4173 | `docker compose up -d --build` or `scripts/demo-up.sh` |
| `api` (FastAPI) | 8000 | `docker compose up -d --build` |
| `mcp` (Streamable HTTP MCP, needs `MCP_TOKEN`) | 8001 | `docker compose --profile mcp up -d --build` |

## First run on a host

```bash
cp .env.example .env      # then edit:
#   BIND_ADDR=<this host's Tailscale address>   (tailscale ip -4)
#   MCP_TOKEN=<random>                            only for the mcp profile
#   MCP_ALLOWED_HOSTS=<magicdns-name>:8001        optional extra Host names for MCP
#   ROUTING_SOURCE=live                           optional; the default is cache (committed routes first)
#   OPENROUTER_API_KEY=...                        optional; without it the rules interpreter is used
docker compose --profile mcp up -d --build
curl --fail http://<BIND_ADDR>:8000/api/health
```

## Everyday

```bash
docker compose ps                 # state and health
docker compose logs -f api        # follow logs
docker compose restart api        # restart one service
docker compose --profile mcp down # stop everything; the data volume stays
docker compose --profile mcp up -d --build   # update after `git pull`
```

`docker compose down -v` also deletes the `city-data` volume (SQLite store and routing cache). Both rebuild themselves from the committed fixtures on the next request, so this is safe but forgets any live routing responses.

## Design notes

- Ports are published only on `BIND_ADDR` (default `127.0.0.1`). Never set it to `0.0.0.0` or a public address; reachability is the Tailscale network only. Docker publishes ports through its own firewall rules, so do not rely on a host firewall alone.
- The image holds code and the committed fixtures only. Secrets come from `.env` at run time (gitignored, not copied into the image, excluded by `.dockerignore`).
- The container runs as an unprivileged user with a read-only root filesystem, no capabilities and `no-new-privileges`. The only writable places are `/tmp` and the `city-data` volume at `/app/data/local`.
- `restart: unless-stopped` brings both services back after a reboot or crash.
- The frontend runs in the `web` container (`frontend/Dockerfile`): an unprivileged nginx serves the built app with gzip and forwards `/api` to `api`. For the live demo on any team machine, see `docs/DEMO.md`.
- Full Warsaw open-data caches (`data/local/warsaw_open_data_raw.json`) are not in the image. To use them, copy the file into the volume. Without it the layers serve the committed 8-feature samples.

## Verified and not verified

18 October 2026: the full stack (`web`, `api`, `mcp`) was built and run on silver-storm with `docker compose`; the page, `/api` through nginx, gzip, fonts and a model-picked outing answered from another tailnet machine. The backend image also served all six outings with no network at all (`ROUTING_SOURCE=cache`).

Earlier note:

Verified: `docker compose config` accepts the files, and the app plus MCP start and answer from a directory that contains only `backend/app` and `data/fixtures` (the same layout as the image), with an empty writable `data/local`.
Not verified: `docker build` and `docker compose up`. The author's account cannot reach the Docker daemon on silver-storm, so the first build on a host with Docker access is the real test. Fix anything it finds before relying on it.

## Static demo on GitHub Pages

`.github/workflows/pages.yml` builds the frontend with `pnpm run build:pages` (`vite build --mode pages`, base `/1_ft_ddos_waw_open_data_hackathon/`) and publishes `frontend/dist`. Switch Pages on once under Settings, Pages, Source: GitHub Actions. The site then lives at `https://delta-43.github.io/1_ft_ddos_waw_open_data_hackathon/` and needs no server, key or secret.

In this mode (`DEMO` in `frontend/src/demo/mode.ts`) nothing calls `/api` and nothing loads from another host:

- **Answers** are snapshots of the contract 1.0 responses in `frontend/public/demo/` (six tracks, 75 places, four city layers). Rebuild them with `PYTHONPATH=backend .venv/bin/python scripts/build_demo_fixtures.py`. The snapshots are labelled `cached`, not `live`. The car-free example and the corridor and timetable caches are the existing files in `frontend/public/`.
- **Map**: `frontend/public/demo/warsaw.pmtiles` (about 11 MB) is a slimmed extract of the OpenMapTiles-schema tiles the live map reads from OpenFreeMap, for central Warsaw (z5 to 14; z13 and 14 only around the demo outings, 20.96 to 21.08 E, 52.19 to 52.27 N), with the Noto Sans glyphs in `demo/fonts/`. Panning is limited to that area. Rebuild with `scripts/build_demo_tiles.py` (`pip install pmtiles mapbox-vector-tile`). Attribution stays: OpenStreetMap contributors (ODbL), OpenMapTiles.
- **Privacy**: nothing is stored on the visitor's device either; the language choice and city reports live in memory only.
- **Scenarios** (scenario picker, `frontend/src/demo/`) replay the pitch with the app's own actions; the roadmap scenario is a labelled mock-up.

Local check: `cd frontend && pnpm run build:pages && pnpm run preview:pages`, then open `http://127.0.0.1:4173/1_ft_ddos_waw_open_data_hackathon/`.
