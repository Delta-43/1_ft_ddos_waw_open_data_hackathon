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
#   ROUTING_SOURCE=cache                          for the pitch (see docs/DATA.md, DATA-06)
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

Verified: `docker compose config` accepts the files, and the app plus MCP start and answer from a directory that contains only `backend/app` and `data/fixtures` (the same layout as the image), with an empty writable `data/local`.
Not verified: `docker build` and `docker compose up`. The author's account cannot reach the Docker daemon on silver-storm, so the first build on a host with Docker access is the real test. Fix anything it finds before relying on it.
