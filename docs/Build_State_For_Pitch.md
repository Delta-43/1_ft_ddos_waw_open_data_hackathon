# Build state for the pitch slides

Snapshot of what the Warsaw 2076 build does **right now**, so slides and narration claim only what is true. Written 2026-10-17 19:56 (Europe/Warsaw) from `main` at `a1b3f5e`, after running the backend and the app. Re-check anything marked "unverified" before it goes on a slide. Feature freeze is 06:00 Sunday; this will change until then, so ask Delta for a refresh before the final slides.

## One-line truth

A user describes a quiet, green museum outing; the app returns three ranked **real street routes** for central Warsaw (Łazienki/Ujazdów area) built from OpenStreetMap places, with green and quiet scores that are **estimates (proxies), not measurements**, every number labelled by source, on a 3D map. An MCP server exposes the same planner to AI agents.

## Works and is safe to say (verified)

| Claim | Evidence |
| --- | --- |
| Three candidate routes per request, ranked, with street-following geometry | Live run today: "Museums inside the parks" 3.3 km / 43 min walking, "Museums through the parks" 3.7 km / 49 min, "Direct museum route" 2.1 km. Geometry from the OSRM service (OpenStreetMap data). Falls back to labelled straight lines if routing fails |
| Real places: 75 named OpenStreetMap places in one ~2×2 km demo area | Fetched 2026-10-17 16:19 (Overpass). 6 museums, 3 galleries, 12 parks, 5 gardens, plus historic buildings, artworks and castles. ODbL, © OpenStreetMap contributors |
| Green and quiet scores exist and rank routes | Green = share of the route inside or within 20 m of an OSM park. Quiet = distance from major roads. Example: green 0.53 / quiet 0.64 for the recommended route against 0.00 / 0.46 for the direct one. **Always say "estimate"** |
| Every metric carries a source label (Real, Proxy, Simulated, Cached) and a sources drawer | In the app; method text for each proxy is in the API response |
| Opening hours are checked against the planned arrival time | Planner reads OSM hours; museums known closed are left out, unknown hours are flagged in the explanation. 4 of the 9 museums and galleries have no hours in OSM, so "hours not known" will appear often |
| Open city data layers on the map: air quality stations, AED defibrillators, public toilets, cultural events | From dane.um.warszawa.pl (CC BY), fetched 2026-10-17 ~13:57. **The map holds only 8 sample features per layer**, not the full city sets (141 stations, 710 AEDs, 695 toilets, 352 mapped events were fetched but not committed) |
| Historical overlay: 1935 / 1939 / 1945 aerial and map imagery toggle | From the city's WMS (wms.um.warszawa.pl). Merged today. Reuse terms and on-screen credit are still being settled (issue #76); ask before putting it in a slide |
| MCP server over HTTP: an AI agent can plan outings and query places and layers | Tested with the official MCP Python client over the Tailscale network; 4 tools; bearer-token protected. Uses the same planner as the app |
| Stale live data is not shown as live | Any record older than 30 minutes is flagged stale. Air-quality readings in the demo are cached hours old and say so |
| Privacy by design | The backend stores no profiles, preferences or trip history; requests are stateless. Say "planned design" for scoped tokens, not "built" |
| Tests | 111 backend tests pass; frontend type-check and build pass; CI green on `main` |

## Partly working (say it plainly)

- **AI**: code for natural-language preference reading and AI-worded explanations exists and is tested with fakes. **No model key is configured and no real model call has been made.** Today's explanations come from rules (`interpreted_by: rules`). Do not claim an AI wrote what you see unless Delta confirms a key was added and tested.
- **Shared server check by a teammate (INT-01)**: the backend is reachable on the Tailscale network from Delta's machine; no teammate has confirmed completing the flow on their own device yet.
- **Containers**: Docker files for deploying the backend on delta-server are written and reviewed but **never built or run**. Say "being prepared", not "deployed".
- **Place cards and pop-ups, preference chips, historical overlay**: built by the frontend team; check them in the running app before showing screenshots.

## Mock, simulated or not built (never present as real)

- **Noise**: no measured noise anywhere. The quiet score is a traffic-exposure proxy from road distance. The city's noise map (modelled 2022, map tiles only) is not integrated.
- **Greenery**: a park-proximity proxy, not tree canopy or shade. A better source (city tree layers) exists but is not integrated.
- **Roadworks, live traffic, live vehicle positions, public transport routing, EV charging, event schedules for the demo day**: not integrated. The city's roadworks feed was not fetched (no key on the shared host). Transit data (GTFS) was checked and deferred. The 8 sample events all fall between December 2026 and January 2027, so "events today" is not available.
- **Accounts, profiles, achievements, social walking, AR, then-and-now cultural layer, accessibility and cool-route modes**: roadmap only. Present as next steps. The isometric mockup (`mockups/warsaw-2076/`) uses mock routes and mock scores and is a pitch backup, not the product.
- **Coverage**: one small demo area in central Warsaw, not the whole city. Routes outside it have no park or road data and would score meaninglessly.

## Claims to avoid

- "Measured", "real-time", "live traffic", "AI-powered recommendations" (until a model call is verified), "city-wide data on the map", "deployed", "tested on all devices".
- Any environmental benefit (CO2, noise or health reduction) as an achieved result. IDEA.md says to verify every figure before it appears on a slide; the build has no such measurements.

## What to show in the demo (known to work)

1. Landing view of Warsaw in 3D, then open the assistant and type "A quiet green museum outing on foot".
2. Three ranked routes with Real/Proxy labels; select a route and watch the map highlight it.
3. Place cards with data-source labels; open the sources drawer.
4. Optional: toggle a city data layer; then show the MCP call from an AI client (`scripts/mcp_client_demo.py` prints the three routes).

Keep a recording and screenshots as a fallback: the map tiles need internet, and the routing service is a free public one with no uptime guarantee. For the pitch run, Delta can switch the backend to use stored routing responses.

## Where the facts live

`docs/DATA.md` (every source, date, limit), `docs/DECISIONS.md`, `contracts/README.md`, `docs/PITCH.md` (ownership and suggested narrative), `docs/DEPLOYMENT.md`. Ask Delta for a refresh after the 06:00 freeze.
