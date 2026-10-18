# Data and service catalogue

Every data source, its licence, when it was fetched and what it can and cannot support.

| Dataset/service | Source URL | Licence/terms | Fetched at | Coverage/freshness | Mode |
| --- | --- | --- | --- | --- | --- |
| Demo routes (`route-response.json`) | Repository fixture | Team-authored synthetic example | Not applicable | Two straight-line routes; invented green/quiet scores, each labelled with which real dataset it could draw from once BE-01 exists | mock |
| Demo places (`places-response.json`) | Repository fixture | Team-authored; real names, approximate coordinates | Not applicable | Five central Warsaw places; no opening hours | mock |
| OSM places (Łazienki/Ujazdów demo area) | https://overpass-api.de/api/interpreter | ODbL; © OpenStreetMap contributors | 2026-10-17T16:19:06+0200 | One ~2km x 2km demo bounding box (`52.2060,21.0220,52.2250,21.0480`); 1124 raw elements, 75 named places (museums, galleries, parks, named gardens, historic buildings/castles/churches/ruins) after dropping unnamed fragments and low-value historic tags | real |
| Warsaw open data: air quality | https://dane.um.warszawa.pl/api/action/get_bopipk_monitoring_jakosci_powietrza | CC-BY; Urząd m.st. Warszawy | 2026-10-17T13:57:14+0200 | 141 monitoring stations city-wide, live readings | real |
| Warsaw open data: AED locations | https://dane.um.warszawa.pl/api/action/get_scb_lokalizacja_defibrylatorow | CC-BY; Urząd m.st. Warszawy | 2026-10-17T13:57:14+0200 | 710 defibrillators city-wide | real |
| Warsaw open data: public toilets | https://dane.um.warszawa.pl/api/action/get_m_toalety | CC-BY; Urząd m.st. Warszawy | 2026-10-17T13:57:14+0200 | 695 facilities city-wide, source has no stable id (synthesised from array index) | real |
| Warsaw open data: events calendar | https://dane.um.warszawa.pl/api/action/get_bmm_kalendarz_wydarzen | CC-BY; Urząd m.st. Warszawy | 2026-10-17T13:57:14+0200 | 652 raw events, 352 kept with a resolvable map point (300 dropped: no coordinates, not guessed) | real |
| Warsaw open data: open sports fields | https://dane.um.warszawa.pl/api/action/get_be_otwarte_boiska + OSM Nominatim geocoding | CC-BY (city data) + ODbL (OSM geocoded coordinates) | City data fetched 2026-10-17T14:21:49+0200; geocoding not completed, see note below | 1227 raw records fetched; 308 unique addresses, 0 successfully geocoded so far | blocked |
| Historical map overlays (1935/1939/1945; backend only, not shown in the app) | https://wms.um.warszawa.pl/serwis | Fee-exempt, mandatory attribution under Polish PSI reuse law (ustawa o otwartych danych); © Urząd m.st. Warszawy, Biuro Architektury i Planowania Przestrzennego | 2026-10-17T18:45:58+0200 | 3 bounded raster images over central Warsaw (1935 aerial photo, 1939 city plan, 1945 aerial photo of the destroyed city), each verified to render a real image | real |
| Simulated environment and disruptions (`simulated-environment.json`, SIM-01) | Repository fixture | Team-authored invented values; each category's entry records the real source it could draw from once integrated (Warsaw WMS noise layers, the real air-quality layer, no live traffic/incident/roadworks source checked) | Not applicable | Noise, route air score, traffic, incidents, roadworks - 2 samples each except incidents/roadworks (1 each); not wired into any API response, no contract field exists for these yet | simulated |
| Simulated events/profile/charging (`simulated-events-profile-charging.json`, SIM-02) | Repository fixture | Team-authored fictional records, kept distinct from the real committed events dataset above | Not applicable | 2 fictional events, 1 fictional demo persona (no real account/calendar/habit data), 2 fictional EV charging stations; not wired into any API response | mock |

For each import, retain source identifiers, normalise coordinates, and record missing fields.
Do not commit personal calendars, habits, tokens, or a real user's location history.
SQLite holds city data only, never user profiles, preferences, trip history or achievements. Personal data stays on the user's device.
Use bounded HTTP timeouts and a cached/fixture fallback. External-service checks are manual, not required CI.
The starter fixture is not a museum catalogue or navigable street route.

## Frontend data caches

Committed under `frontend/public/` so the app needs no build-time fetching. All are rebuildable with the
scripts named; see docs/DEVELOPMENT.md, Rebuilding the data.

| File | Built by | Source, date | Contents and limits |
| --- | --- | --- | --- |
| `corridor-cache.json` (2.5 MB, gzip about 0.4 MB) | `scripts/build_corridor_cache.py` | OpenStreetMap via Overpass, 18 Oct 2026; Wikipedia REST summaries (CC BY-SA 4.0) linked by OSM `wikipedia`/`wikidata` tags | Within 260 m of the six outings: 2,441 buildings (heights from `height`, else `building:levels` × 3.2 m, else 10 m; flagged `est`), 2,471 green areas, 1,685 generated tree points (26 m grid inside parks), 106 toilets and AEDs, 197 named grocery shops, culture facts (name, kind, start date, architect, heritage) for 46 buildings and Wikipedia summaries for 18. Culture = museums, galleries, theatres, places of worship, palaces, castles, monuments and similar; not every heritage-listed tenement |
| `transit-cache.json` (2 MB) | `scripts/build_transit_cache.py` | ZTM Warsaw GTFS by Mikołaj Kuranowski, feed of 18 Oct 2026 00:15 | 69 stops within 320 m of the outings and the 5,699 trips through them on 18 Oct; the app moves vehicles by schedule (interpolated along the line shape), not live GPS. One service day only |
| `transit-examples.json` (9 KB) | `scripts/build_transit_examples.py` | Same GTFS feed; shops from `corridor-cache.json` | Earliest car-free itinerary from the Centrum start at 11:00 to three outing destinations with a 12-minute grocery stop. Walking legs are straight lines (labelled). Examples, not a journey planner |
| `fonts/` | downloaded once from Google Fonts | SIL OFL 1.1 (`fonts/OFL.txt`) | Barlow Condensed, Titillium Web, Biryani; Latin and Latin Extended |

Street routes for the six outings are committed in `data/fixtures/osrm-cache/` (38 FOSSGIS OSRM responses),
so `ROUTING_SOURCE=cache` serves them with no network; verified on 18 Oct 2026 in a container without network.

## Greenery and quiet proxy method

The route `green_score` and `quiet_score` are proxies calculated by `backend/app/services/scoring.py` from OpenStreetMap geometry. They are not measurements. Each response carries them as sources `green-proxy` and `quiet-proxy` with `mode: proxy` and a `method` string (`GREEN_METHOD`, `QUIET_METHOD`), so the UI can show the label and the method for every score.

**Green score (0–1, higher is greener)**
1. Sample the route line every 25 m.
2. A sample counts as green if it lies inside, or within 20 m of the edge of, an OSM `leisure=park` or named `leisure=garden` polygon.
3. The score is the share of green samples.

**Quiet score (0–1, higher is quieter)**
1. Sample the route every 25 m.
2. For each sample, take its distance to the nearest OSM motorway, trunk, primary or secondary road, divided by that class's reach (motorway 300 m, trunk 250 m, primary 200 m, secondary 120 m), capped at 1.
3. The score is the mean over the samples.

**Input:** `data/fixtures/osm-context.json`, an Overpass snapshot taken 2026-10-17 15:53 +02:00 for bbox `52.200,21.000,52.240,21.050`: 65 park polygons and 548 major road segments (ODbL, © OpenStreetMap contributors). It is committed so scoring works offline.

**What it does not show:** tree canopy, shade, pavement surface, vegetation quality, traffic volume, speed or measured noise (dB). A park polygon counts as green even if its path is paved or sunless. A quiet street can still be loud.

**Known limits**
- Outside the snapshot's bbox no parks or roads are loaded, so a route there scores 0 green and 1 quiet. That reflects missing input, not a finding (checked: a Mazovian test line far west of the area returns 0.0 / 1.0). Demo routes stay inside the bbox.
- Only major roads are used. Tram lines, railways, airports and building density are ignored.
- The 20 m buffer and the road reach distances are our choices, not calibrated against any survey.

**UI rule:** any display of these scores must show the "Proxy" label from `SourceLabel` and may say "greenery estimate" or "traffic-exposure estimate". It must not say measured, shade, canopy or noise level. A better greenery source exists but is not integrated: the Warsaw WMS layers `ZIELEN_DRZEWA`, `ZIELEN_TRAWNIKI` and others (see DATA-02 above), which are map tiles only. Modelled WMS noise (2022) could later replace the quiet proxy, labelled as modelled.

**Sanity check (live run, 2026-10-17):** for the same museum outing, the route inside parks scored green 0.53 / quiet 0.64, the route through parks 0.12 / 0.56 and the direct route 0.00 / 0.46. The ordering matches the intent; the absolute values mean nothing on their own.

## Stale live-feed rule

A feed that answers is not a feed that is current. Vehicle locations, departures and station readings can stop updating during repairs, holdbacks or technical stops. Rule for every live-style input (implemented in `backend/app/services/freshness.py`):

- Judge each record by its own timestamp. More than 30 minutes old, missing, unreadable or in the future means **not live**.
- Show such records as "last seen HH:MM" or leave them out. Never draw them as live, never extrapolate their position, and never fill the gap with a guess.
- Show `retrieved_at` and the record's own update time next to any "live" claim in the UI and the pitch.
- Status today: no vehicle-position or departure feed is integrated, so only the air-quality layer is affected. Its features carry `properties.freshness`, and the committed cached readings are correctly reported as stale. If a live transit feed is added later it must use `split_live`.

## Routing provider verification

Provider: FOSSGIS OSRM, `https://routing.openstreetmap.de/routed-foot` and `/routed-bike` (OpenStreetMap data, ODbL). No account or key. Code: `backend/app/services/routing.py`. Verified live on 2026-10-17 at 18:10 +02:00 with `overview=full&geometries=geojson`. HTTP 200 and `code: Ok` for all four requests, 0.19–0.20 s each, GeoJSON `LineString` in longitude, latitude order:

| Pair (from → to) | Profile | Points | Distance | Duration | Straight line |
| --- | --- | --- | --- | --- | --- |
| Centrum Sztuki Współczesnej (21.0307378, 52.2196963) → Muzeum Łowiectwa i Jeździectwa (21.0390467, 52.2135312) | foot | 200 | 1220 m | 976 s | 886 m (route 1.38×) |
| same | bike | 130 | 1906 m | 517 s | 886 m (route 2.15×) |
| Mauzoleum Walki i Męczeństwa (21.0236508, 52.2176184) → Cele Bezpieki (21.0239587, 52.2206202) | foot | 48 | 482 m | 388 s | 332 m (route 1.45×) |
| same | bike | 46 | 488 m | 197 s | 332 m (route 1.47×) |

Many vertices and a distance well above the straight line show the geometry follows streets and paths. The first bike route is much longer than the walking route, so the bike profile avoids paths the foot profile uses (not investigated further).

Limits and behaviour, as recorded:
- **Coverage:** not limited to Warsaw. A Łazienki → Paris foot request also returned `Ok`. The demo area needs no coverage workaround.
- **Terms and quota:** a public community service with no key, no published quota in our requests (no rate-limit headers were returned) and no uptime guarantee. Keep use light and identify the client (`User-Agent: warsaw2076-hackathon-delta/1.0`). Re-read the service's usage policy before relying on it beyond the demo.
- **Timeout:** 8 s per request; one request per candidate route.
- **Fallback chain:** `ROUTING_SOURCE=live` tries live, then the cache; `ROUTING_SOURCE=cache` (use for the pitch) tries the cache first. Live responses are cached in `data/local/osrm-cache` (not committed). `data/fixtures/osrm-cache` holds 20 committed responses for the demo prompts.
- **Total failure:** the planner returns straight lines with `geometry_kind: straight_line`, response `mode: mock` and a notice saying so. These are never presented as street routes (test: `test_routing_outage_falls_back_to_labelled_straight_lines`).
- **Not verified:** behaviour under repeated load, and the service's availability at pitch time. Switch to `ROUTING_SOURCE=cache` before the demo.
