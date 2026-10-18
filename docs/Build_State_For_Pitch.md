# Build state for the pitch

What Find YOUR way does **now**, so slides and narration claim only what is true. Written 2026-10-18 from `main`
after #120, with the container stack running on the shared host. Re-check anything marked "not verified".

## One-line truth

You describe how you feel; a language model picks one of six predefined outings for central Warsaw; a real
routing service draws the street route; the map lights up only along it, with OpenStreetMap buildings, parks,
culture places, toilets and defibrillators, timetable-driven buses and trams, and every number labelled by source.

## Safe to say (verified)

| Claim | Evidence |
| --- | --- |
| The AI picks the outing from free text | `POST /api/tracks/run` makes one OpenRouter call (`picked_by: model`) on the shared server; the panel says "Picked by AI". Without a key, "Matched by keywords" |
| Real street routes | FOSSGIS OSRM on OpenStreetMap data; the six outings' routes are also committed, so the demo works offline from the routing service (`ROUTING_SOURCE=cache`, verified with no network) |
| 3D only along the route | 2,377 OSM buildings, 2,471 green areas and 1,685 tree points cached for the demo area; heights mostly estimated from floor counts and labelled so |
| Culture cards | 46 culture buildings; 18 with a Wikipedia summary (CC BY-SA), the rest with OSM facts only. No generated text |
| Public transport your way | ZTM GTFS for 18 October: 69 stops near the routes, 5,699 trips; vehicle dots are scheduled positions, labelled "not live" |
| Car-free example with groceries | Precomputed from the same timetable for 11:00: e.g. bus 131 with 12 minutes at Biedronka, arriving 11:42. Labelled as an example |
| Toilets and AEDs near the route | OpenStreetMap, 106 in the demo area |
| Labels and credits | Every metric shows Real, Proxy, Simulated, Cached or Historical; credits always visible |
| English and Polish | Interface chrome in both; content from the backend and the demo notes is English |
| MCP | The same planner through four MCP tools, token-protected |
| Containers | `docker compose up -d --build` on a fresh machine: web on 4173, API on 8000; built and verified on the shared host |
| Privacy | No profiles, preferences or trip history on the backend; reports stay in the browser |

## Say plainly

- The six outings are **predefined**; only the street route and the scores are computed per request. The AI
  chooses among them; it does not plan new outings.
- Greenery and quiet are **estimates** from park and main-road distances, not measurements.
- The car-free itineraries are **precomputed examples** for one day, not a live journey planner.
- Coverage is central Warsaw (Centrum to Łazienki), not the whole city.

## Invented, never present as real

Offers and tickets (invented businesses), two events (SIM-02), the example reports. Each says "Demo" or
"invented" in the app.

## Not verified

A real GPU (smoothness), Safari, a real phone, reduced-motion mode in a real browser, teammates' devices
reaching port 4173.

## Claims to avoid

"Measured", "real-time traffic", "live vehicle positions", "city-wide", "plans any trip", and any environmental
benefit as an achieved result.
