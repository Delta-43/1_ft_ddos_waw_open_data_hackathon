# Live demo on any team machine

The whole app (web + API) runs as two containers. Any of our computers with Docker can host it.

## Start

Linux or macOS, from the repository root:

```bash
git pull
scripts/demo-up.sh          # builds, starts, prints http://<tailscale-ip>:4173
scripts/demo-up.sh down     # stop
```

Windows (Docker Desktop, PowerShell), from the repository root:

```powershell
git pull
$env:BIND_ADDR = (tailscale ip -4 | Select-Object -First 1)
$env:WEB_PORT = "4173"
docker compose up -d --build api web
# open http://<that address>:4173 ; stop with: docker compose down
```

The first build downloads the base images and takes a few minutes; later starts take seconds.

## What it needs

- Docker with Compose v2, and Tailscale signed in (without Tailscale it serves this machine only).
- Internet for the map tiles (OpenFreeMap). Everything else is in the repository: the 3D corridor,
  the timetable for 18 October, the car-free examples, the fonts.
- Optional `.env` (copy `.env.example`): `OPENROUTER_API_KEY` lets the AI pick tracks; without it a
  keyword match picks them. `ROUTING_SOURCE=cache` uses the committed street routes instead of live OSRM.

## Before the pitch

- Open `http://<address>:4173/?time=11:00` so buses and trams run at the demo time.
- Check on the presenting laptop: the intro flight, a prompt, a mood switch, the car-free example,
  hovering a violet building, the Nearby toggles, and the reports button.
- Keep a screen recording as the fallback if the venue's internet fails (map tiles are online).
