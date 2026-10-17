# Delivery plan

## Team

| Pair | Expert | Novice | Primary ownership |
| --- | --- | --- | --- |
| Backend | Delta | Sonia | API, data, routing, AI, MCP |
| Frontend | Alban | Ola, Aryna | Map, route comparison, forms (Ola), place cards and source labels (Aryna) |

Delta is integration lead and leads pitch conception and delivery. Alban leads presentation design.
Each person owns a bounded feature and uses a coding agent. Novices produce their own PRs with expert guidance.

## Deadline and feature freeze

The official agenda currently ends project work at **11:00 on Sunday 18 October 2026**, Europe/Warsaw (UTC+02:00).
Source: https://42warsaw.pl/pl/hackathon-otwarte-dane-warszawa/
Confirmed with organisers on 17 October 2026. Update this file if they change it.

- **06:00 Sunday:** stop all feature work, five hours before submission. Start pitch and presentation preparation.
- **06:00–06:30 only if needed:** Delta may authorise fixes to existing demo blockers. Other members continue pitch work.
- **06:30:** absolute coding stop. Drop incomplete features and use the last working demo or recording.
- **06:30–08:00:** Delta shapes narrative and delivery; Alban designs slides; Sonia checks evidence and data labels; Ola and Aryna capture demo assets.
- **08:00–09:00:** rehearse the entire pitch and demo; prepare an offline recording and screenshots.
- **09:00–10:00:** tighten slides, timing, transitions, and answers to likely questions.
- **10:00–11:00:** submission checks and buffer. Verify organiser requirements; submit early when ready.

These pitch blocks are internal targets. Fit the final presentation to the organiser's confirmed time limit.
The grace period does not move the submission deadline or justify a new feature.

## Build milestones

1. First 45 minutes: confirm scope/deadline, create repository, make CI green, enable protection, agree contract and demo scenario. Done on 17 October except the contract (API-01, #7) and the demo scenario.
2. First two hours: integrated preference request → mocked API response → visible frontend result. Verify teammate device access.
3. Next: Sonia prepares real data and provenance; Ola builds forms; Aryna builds place cards; experts integrate map and candidate-route services.
4. Once core works: grounded AI interpretation/explanation and MCP tools using the same services.
5. Before 06:00: merge the last green feature PRs, smoke-test main, and mark the demo commit. Prepare fixture fallback.

Every 60–90 minutes: five-minute sync on blockers, contracts, integration, and scope. Escalate a blocker after 15 minutes.
Cut scope if the end-to-end demo is behind; retain real data, clear route comparison, and an honest explanation.

## Core acceptance

- A request produces a valid contract response and draws candidate routes with place cards.
- At least one usable Warsaw dataset has recorded source/licence/fetch date.
- Environmental scores and routing limitations are explicit; mocked inputs are visible.
- AI cannot invent route geometry or availability.
- One MCP tool uses the same service as REST.
- main passes CI and the shared demo runs from a documented command.
- Fixture mode works without external API credentials. Online map tiles may still require connectivity; keep a recording.

## Stretch only after core

PWA installation, landmark models, extra outing types, and an AR concept slide.

## Source research for a fresh Saturday build

Research reviewed **16 October 2026** from an earlier Warsaw project. Owner-only connection details are kept separately.
No remote files, database, or services were changed. Credentials and private configuration were not read or copied.
This assessment verifies code and snapshot presence, not current database contents or successful fresh ingestion.
Most cached files are dated **30 September 2026**. Model/source dates can be older than download dates.

### Source availability and fit

| Source | Evidence found in the existing project | Availability / access | Use in this hackathon and limits |
| --- | --- | --- | --- |
| OpenStreetMap places, parks, roads | `data/sources/amenities/osm.py`; `data/snapshots/warsaw/osm-amenities/{pois,parks,roads}_2026-09-30.json` exist | Cached raw JSON present; fresh Overpass calls not tested. ODbL; credit OpenStreetMap contributors | Best first import: restaurants, cafes, pubs, parks. Raw JSON retains tags, but the old processed POI frame discards names/IDs. Write a small independent normaliser preserving them. |
| OSM district boundaries | `data/sources/boundaries/osm.py`; cached `boundaries/osm_admin9_2026-09-30.json` | Snapshot present; 18 districts documented | Context overlays and district joins; not a street routing graph. |
| Warsaw city open data | `data/pipeline/waw_open_data.py`; `data/sources/amenities/waw_open_data.py`; cached sports grounds, AEDs, and official stops | Existing client uses POST to `https://dane.um.warszawa.pl/api/action/<endpoint>` and a raw Authorization token, not Bearer. Key required; fresh authenticated calls not tested | Useful official source. Existing files cover public sports grounds and AEDs; inspect records for coordinates and access hours. Obtain/configure a key separately; do not copy existing secrets. |
| Warsaw timetable GTFS | `data/sources/transport/gtfs.py`; `data/snapshots/warsaw/gtfs/ztm_2026-09-30.zip` exists | Community mirror `https://mkuran.pl/gtfs/warsaw.zip`; provider index checked today and still lists Warsaw. A fresh archive was not downloaded | Stops, scheduled departures, and transport context. Check calendar_dates and frequencies; the old stop_times file was reported as 549 MB. Do not parse the entire feed during a request. Retain all attributions.txt credits and applicable ZTM/OSM terms. |
| District commute matrix | `data/sources/transport/commute.py`; `data/snapshots/warsaw/commute_matrix_2026-10-07.csv`; `/commute` handler exists | Cached estimate present. Old manifest says not loaded; later handoff says shipped. Current database and HTTP response not verified | District-centre estimates for a representative morning, not an arbitrary-location journey planner or today's live trip. Optional context only. |
| GIOŚ air quality | `data/sources/environment/gios.py`; station/sensor and archive JSON caches present | Public API `https://api.gios.gov.pl/pjp-api/v1/rest/`; no key documented. Archive limit documented as two requests/minute; source code notes an Accept-header issue | Existing estimates use September 2025–August 2026 measurements, interpolated to district centroids. Label historical/estimated. They do not measure air along today's route. Avoid a full archive refresh during the event. |
| Copernicus tree cover | `data/sources/environment/{copernicus,tree_cover}.py`; cached `copernicus/tcd_2024.zip` | Raster archive present; fresh download needs account/token. Do not reuse private token files | 2024 canopy context; clip to a small demo area before route scoring. Existing district means cannot establish shade on an individual pavement. Verify product terms from metadata. |
| Copernicus Urban Atlas | `data/sources/environment/urban_atlas.py`; `copernicus/urban_atlas_2018.zip` (~116 MB) | Cached archive present; nested archive/FlatGeobuf and reprojection documented | Historical 2018 land use; existing classes 14100/31000 support green-area context, not current park access. OSM park geometry is simpler for the first demo. |
| Warsaw strategic noise map | `data/sources/noise/warsaw_wms.py`; `noise/lden55_masks_2026-09-30.npz` | Cached masks present; public WMS `https://wms.um.warszawa.pl/serwis`; fresh GetMap not tested; redistribution terms still need checking | Modelled **2022** noise bands, not live noise readings. Existing masks indicate >=55 dB using a colour palette inferred from Kraków; do not present them as exact measured route dB. Use as labelled context or defer. |
| Historical road accidents | `data/sources/safety/sewik.py`; national SQL dump and extracted files present | Historical SEWiK source via community dump; old project records non-commercial/attribution restrictions. Review reuse before exporting | 2022–2024 accident aggregates can support historical context. They do not provide current incidents, congestion, or closures. Avoid copying raw participant/vehicle tables. |
| Warsaw statistics | `data/sources/demographics/panorama.py`; `panorama/panorama_2024_annexes_2026-09-30.zip`; generated dictionary lists crime/population context | Cached official 2024 annexes; snapshot presence verified, not a fresh download | District context only; low priority for navigation. Crime counts must not be turned into a route safety verdict. |
| Nurseries and housing | Nursery connector/cache, RCN/NBP and rent connectors documented | Existing project contains these sources; not all archives inspected. NBP reuse terms unresolved in notes; rent data is a dated listing snapshot | Out of the core navigation demo. Do not spend time importing housing prices or rerunning listing scrapers. |

The public GTFS provider also lists realtime alerts and vehicle positions. These are new integration candidates, not verified working inputs here.
Vehicle trip IDs may not match static GTFS; realtime alerts and positions have different reuse terms.
Provider details: https://mkuran.pl/gtfs/ .

### Gaps that remain

- Museums, historic sites, landmarks, charging stations, petrol stations, and a complete cycling network are **not covered by the inspected OSM query**. Add explicit categories and validate actual records.
- Events, roadworks, parking, weather, and city air sensors are mentioned in the old portal research but were not loaded there. Discover their current endpoints and check dated sample responses before promising them.
- Live traffic, live incidents, charger occupancy, opening hours, ticket availability, prices, promotions, and calendar integration have not been established.
- The cached road query excludes footways, paths, cycleways, and service roads. It is unsuitable as a complete pedestrian/cycling routing graph.
- Existing FastAPI endpoints return district summaries. They cannot replace the new route service. Reuse carefully selected inputs/methods rather than importing the Postgres/Supabase deployment.

### Saturday implementation policy

The organisers approved building on this starter. The other project is research evidence only: do not import its code, snapshots, database, or deployment.
Earlier cached files demonstrate that sources have worked; they do not establish current availability. Do not present starter files as work built during the event.

### What to fetch and what to simulate

| Capability | Starting approach | Evidence / fallback |
| --- | --- | --- |
| Places, pubs, restaurants, parks, museums and landmarks | Fetch a small OpenStreetMap sample for one demo area; preserve names, IDs and coordinates | Overpass worked in the earlier project, but fresh availability is unverified. Museums/historic tags need a new query. Cache the event-time response; use labelled fictional fixtures if unavailable. |
| Official Warsaw open data | Verify one useful dataset early, then fetch a small sample | Public sports grounds, AEDs and stops worked previously. Current authenticated access still needs checking. Set up a new project key securely; never use the old project's credentials. |
| Street route geometry | Verify one walking/cycling routing API during kickoff | No ready routing service was established by the inspection. If unavailable, show explicitly illustrative geometry, not navigable directions. |
| Map display | Check the chosen tile/style provider on team devices | Keep a screenshot/recording fallback; cached source data does not make map tiles available offline. |
| Air quality | Simulate route-specific scores initially, visibly labelled | GIOŚ is a real candidate, but historical station/district estimates do not supply live street-level exposure. Add fresh station observations only if easy to verify and label accurately. |
| Noise | Simulate route noise preference scores initially | The known city source is a modelled 2022 WMS, not live sound levels. Do not label a simulated score as measured dB. |
| Green preference | Use actual OSM park geometry where possible | Start with a documented proximity/intersection proxy, not a claim of measured canopy or pavement shade. Simulate only when real geometry is unavailable. |
| Traffic, current accidents and roadworks | Simulate initially | No current working integration verified. Historical accident data is not a live incident feed. Roadworks are a portal candidate for a timeboxed check. |
| EV charging availability and battery constraints | Simulate initially; stretch scenario | Charger locations and real-time occupancy are different datasets; neither integration is established. |
| Events, opening hours, ticket availability and promotions | Curated, explicitly mocked demo records initially | No verified current event integration. OSM opening-hours tags may be missing or stale; unknown remains unknown. |
| Calendar, habits, personal agent and AR integration | Simulated user profile and concept mock-ups | No real account/device integration in the core build. |
| Public transport | Optional fresh GTFS discovery only | The provider index lists Warsaw, but a fresh feed and routing engine still need verification. Simulate transfers initially; do not reuse the district commute matrix. |

### Kickoff source gate

1. Sonia and Delta spend at most 30 minutes checking fresh OSM, one official dataset, and the selected routing provider.
2. Record endpoint, response status, source date, fetched time, attribution and usable record count for each successful fetch.
3. Classify each capability as verified real input, derived proxy, simulation, or deferred. Catalogue presence alone is not a successful check.
4. Give Alban, Ola and Aryna a stable contract and labelled demo fixture immediately; they need not wait for live integrations.
5. Cache only data fetched during the event. Keep the core demo working if a provider later fails.
6. Replace simulations only when a verified source fits the existing contract and time budget. The five-hour freeze still applies.

Public API reachability through the web reader failed for the city catalogue and GIOŚ during research; this does not establish an upstream outage.
The strongest evidence is historical successful retrieval plus inspected connectors, not an uptime guarantee.

### Evidence and scope

Primary remote evidence: `data/sources/SOURCES.md`, the connector files listed above, `docs/DATA_DICTIONARY.md` (generated 2 October),
`docs/HANDOFF_2026-10-02_series_and_commute.md`, and snapshot filenames/sizes.
The old manifest contains stale status claims about commute, NBP loading, and translation. Treat code/file presence separately from deployment and successful ingestion. No reuse of those assets is planned.
Keep this new project's feature-freeze rules, team ownership, fixture policy, and PR rules. The other repository's workflow is not imported.

## Portable onboarding

STACK.md is the shared technical/source entry point; SETUP.md covers a clean local environment. No shared task requires owner-specific skills, SSH accounts or private infrastructure. Delta handles repository/network administration separately.

## Stretch ideas and principles added on 17 October

- Milestones and achievements (distance, places, districts, greener choices): stretch only; see IDEA.md.
- Cultural time-travel layer ("then and now"), social-walking mock, and future-ready roadmap items (accessibility, cool routes, city-layers pattern): see IDEA.md, Cultural layer, community and future-ready directions. All are stretch or roadmap. Priority if time allows after core acceptance: (1) a thin era layer with 6–10 curated, labelled entries; (2) a *Simulated* social-walking card with fictional walkers. Everything else is a roadmap slide only. Both stretch items need an agreed contract with Alban and Delta, their own issue and branch, and must finish before the 06:00 freeze.
- Source gate additions: before promising a cool-route mode, Sonia verifies one Warsaw tree or drinking-fountain dataset and its licence. Before using historical imagery, confirm reuse terms; otherwise use curated cards only.
- Privacy and security: User data stays on the user's device. The backend keeps no user profiles, preferences or trip history; route requests are stateless. A future version sends personal context only per request, with a short-lived scoped token. See IDEA.md, Privacy and security.
