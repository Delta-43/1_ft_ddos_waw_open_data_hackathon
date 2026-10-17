# Warsaw 2076 clickable mockup

Open `index.html` directly, or serve this folder from the repository root:

```bash
python3 -m http.server 5178 --bind 127.0.0.1 --directory mockups/warsaw-2076
```

Visit http://127.0.0.1:5178. No installation, backend, API key, map SDK, or build is required. Google Fonts supplies Manrope and DM Sans when online; the interface also works offline with fallback fonts.

## Route-focused Warsaw map

The fixed isometric view uses cached OpenStreetMap geometry fetched during the hackathon: real Warsaw building footprints, streets, green areas, and the Vistula. Canvas 2D draws extruded buildings; SVG supplies the glowing illustrative routes and interactive stop markers.

Only buildings and local streets within roughly 210 metres of the selected fixture route are detailed. The rest of central Warsaw remains a flat, muted overview. The initial corridor has 234 buildings rather than the full 4,867 in the source extract. Its detail plus the overview total approximately 0.84 MB, compared with the original 8 MB full-map browser cache. Other route details load on demand and stay cached in the page. Nothing fetches from OSM at runtime.

Select a route card to change the highlighted path and its surroundings. Hover, focus, or click a numbered stop to open its place card. Escape closes it. Preferences, travel mode, time budget, validation, loading, and the simulated error switch remain interactive.

## Data honesty

- Map geometry: **cached OSM**, © OpenStreetMap contributors, [ODbL 1.0](https://www.openstreetmap.org/copyright). Source timestamp, endpoint, exact query, and bounding box are recorded in `data/source.json`.
- Of 4,867 source buildings, 288 have a usable OSM height. Another 3,825 use recorded floor counts multiplied by a simulated 3.2 metres. The remaining 754 use a mock 12-metre height. Flat roofs, vertical exaggeration (approximately ×2.3), and decorative trees are simulated. Trees are placed inside OSM green-area polygons; they are not surveyed tree locations.
- Three place markers use cached OSM area centroids (POLIN, Krasiński Garden, Saxon Garden). Other place coordinates remain approximate fixtures. None is a verified entrance.
- Routes, route metrics, environmental scores, opening hours, and AI summaries are **mock**. Dashed lines connect stops directly; they are not street-following routes. Text is not parsed by AI.
- Quiet and green affect default selection. Time budget reports which fixtures fit. Bike mode changes fixture durations. Traffic avoidance has no connected data source. No personal data is persisted.
- Units: longitude, latitude; metres; seconds.

The source and height assumptions are visible under “Map sources & 3D assumptions” in the interface. The extracted data cache is shared under ODbL-1.0; see `data/README.md`.

## Refresh the map cache

Run these from the repository root. The first step contacts Overpass; the remaining steps work offline.

```bash
python3 mockups/warsaw-2076/tools/fetch-map.py
python3 mockups/warsaw-2076/tools/prepare-map.py
python3 mockups/warsaw-2076/tools/split-corridors.py
```

Paths above assume the repository root. `prepare-map.py` creates an intermediate full-map `data/warsaw-map.js`; the app uses only `warsaw-overview.js` and `corridor-*.js`. The intermediate can be removed after splitting. To change the fixture paths, update the longitude/latitude anchors in `split-corridors.py` and the UI together.

## Checks

Verified with Playwright: default route, on-demand corridor loading, all route changes, rapid switching, place cards, Escape, simulated error, successful planning, and no horizontal overflow at 390px. Desktop and phone screenshots were visually inspected. No browser script errors were observed.

This folder is an isolated mockup. Shared application files, contracts, and production services are unchanged.

## Tailscale preview

Owner-hosted preview: http://silver-storm.wirehair-altair.ts.net:5179/

The isolated `warsaw2076-mockup.service` runs under the owner's user account, bound to the Tailscale interface. It serves a release copy outside the checkout. It requires silver-storm and the owner's user session to remain running. No firewall, tailnet policy, or public forwarding was changed.

## Start and share using your VPN IP

From the repository root:

```bash
bash mockups/warsaw-2076/start-demo.sh
```

The script detects this computer's connected Tailscale IPv4 address, binds only to that address, and prints the link to share. Python 3 and a connected Tailscale client are required; no installation or administrator privileges are needed. Keep the terminal open; Ctrl+C stops a server started by the script. If an identical demo is already running on the port, the script prints its link and exits without changing that server.

Choose a different port if needed:

```bash
bash mockups/warsaw-2076/start-demo.sh 5180
```

Your friend opens the printed `http://YOUR_TAILSCALE_IP:PORT/` link while connected to the same VPN, with permission to access that port. The script does not change firewall rules or Tailscale access policies.
