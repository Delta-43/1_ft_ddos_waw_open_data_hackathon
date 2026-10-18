# Running the live demo

The whole app (web + API) runs as two containers on any computer with Docker.

## On your own computer

```bash
docker compose up -d --build
```

Open http://localhost:4173/?time=11:00 . Stop it with `docker compose down`.

## For others on a Tailscale network

Linux or macOS, from the repository root:

```bash
git pull
scripts/demo-up.sh          # builds, starts on this machine's Tailscale address, prints the link
scripts/demo-up.sh down     # stop
```

Windows (Docker Desktop, PowerShell), from the repository root:

```powershell
git pull
$env:BIND_ADDR = (tailscale ip -4 | Select-Object -First 1)
$env:WEB_PORT = "4173"
docker compose up -d --build
# open http://<that address>:4173 ; stop with: docker compose down
```

The Tailscale access rules must allow the web port (4173) for the viewers' devices.
The ports are published only on that address, never on `0.0.0.0`.

## What it needs

- Docker with Compose v2. The first build downloads the base images and takes a few minutes.
- Internet for the map tiles (OpenFreeMap). Everything else is in the repository: street routes for the six
  outings, the 3D corridor, the timetable for 18 October 2026, the car-free examples and the fonts.
- Optional `.env` (copy `.env.example`): `OPENROUTER_API_KEY` lets the AI pick outings from free text;
  without it a keyword match picks them.

## Demo script (about three minutes)

1. Open `/?time=11:00`. Let the intro land on the Mermaid by the Vistula; move the mouse a little.
2. Tap the orb, choose "Somewhere calm and green, with a museum". Watch the route draw and the city rise.
3. Point at the labels: "Picked by AI", Proxy for greenery and quiet, Live or Cached for the route.
4. Hover a violet building for its card. Switch on Nearby toilets and AEDs.
5. Choose the **Bus + groceries** mood: buses only, a real shop on the way, every leg with its time.
6. Tap a red stop for its next departures; point at a moving bus or tram ("scheduled, not live").
7. Open the yellow reports button; close the trip and tap the orb again to resume it.
8. Switch to PL in the title bar.

Keep a screen recording as the fallback if the venue's internet fails (the map tiles are online).
