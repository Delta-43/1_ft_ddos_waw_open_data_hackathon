# Stack, tools, and source guide

Start here with AGENTS.md, SETUP.md, PLAN.md, and your team/<name>/PROMPT.md.
These instructions work with any coding agent or a normal editor. No personal skills, paid agent subscription, private server, or owner's tool bundle is required.
The organisers approved building on this starter (17 October). Fetch data fresh during the event. Do not claim starter files as event work, and do not import earlier projects.

## Agreed stack

| Layer | Choice | Responsibility / status |
| --- | --- | --- |
| UI | React, TypeScript, Vite | Alban + Ola + Aryna; starter reference exists |
| Map | MapLibre GL JS 6.11.2, OpenFreeMap tiles | Alban; added in PR #4. Tiles need network access |
| Styling | Plain CSS initially; Tailwind only if Alban chooses it | Avoid adding tooling before the core flow |
| API | Python 3.12, FastAPI, Pydantic, Uvicorn | Delta + Sonia |
| Storage | SQLite through Python sqlite3 | Backend-local file; no database server or network port; not implemented in starter |
| Fetch/import | HTTPX; small Python normalisers | Sonia; cache event-time responses |
| Data interchange | GeoJSON and shared JSON schema | Coordinates: longitude, latitude; distances: metres; time: seconds |
| AI | One hosted model API with structured output | Delta selects provider, model, budget and SDK Saturday; optional until core works |
| Agent interface | Official MCP Python SDK | Delta selects compatible SDK/client versions Saturday; not implemented in starter |
| Routing | External walking/cycling routing service | Provider still undecided; verify coverage, key, quota, terms and a sample before committing |
| Collaboration | Git, GitHub issues/PRs, GitHub Actions | One checkout/branch per person; expert–novice pair review |
| Shared demo | Tailscale, optional for personal development | Delta supplies connection details; team gets demo access, not SSH |

Use Node.js 22 and pnpm 11.25.0 for the reference frontend. Its exact dependencies are in frontend/package.json and pnpm-lock.yaml.
Python dependency ranges are in backend/requirements.txt. Delta locks the event's tested versions before provider integration.
Do not install MapLibre, GIS stacks, MCP clients, Docker, a vector database, Postgres, or Redis merely to read these docs.
For a small place catalogue, structured tags and filters come before embeddings/vector search.

## Tools each member needs

- Git and their own GitHub account with repository Write access.
- Python 3.12 with venv/pip and Node.js 22 with npm; pnpm 11.25.0.
- An editor, browser developer tools, and their preferred coding agent if available.
- GitHub CLI is optional: every issue/PR/review can use github.com.
- Tailscale only to reach the shared demo, using their own login and Delta's invitation.
- curl is optional; use the browser/API documentation instead when it is unavailable.

No teammate needs access to Delta's home directory, SSH keys, service users, private servers, account-specific skills, or admin tools.
Never share agent or GitHub credentials. Keep provider API keys on the backend; never put secrets in VITE_ variables.

Privacy: User data stays on the user's device. The backend keeps no user profiles, preferences or trip history; route requests are stateless. A future version sends personal context only per request, with a short-lived scoped token. See IDEA.md, Privacy and security.

## Data sources: priority and readiness

“Previously worked” means an earlier project retrieved it. It is not a guarantee of current uptime or permission for this event.
Check a small fresh sample during Saturday's 30-minute source gate. No old snapshots or code are imported.

| Source / entry point | Useful input | Access and verification | Initial decision |
| --- | --- | --- | --- |
| OpenStreetMap / https://overpass-api.de/api/interpreter | Places, parks, museums/historic tags, cafes/pubs | No account normally needed; previous retrieval succeeded. Fresh query untested. Use a small area, identified client, caching and bounded retries. Preserve OSM IDs and attribution; ODbL applies. Coverage/opening hours can be incomplete. | First real-data candidate |
| Warsaw portal / https://dane.um.warszawa.pl/ | Official sports grounds, AEDs, stops; candidates for events/roadworks | Catalogue discovery first. Previous client used POST /api/action/<endpoint> with raw Authorization header; obtain a new project token via /key-api. Verify current docs and dataset terms. Never assume legacy API keys are interchangeable. | Verify one useful official dataset early |
| GTFS / https://mkuran.pl/gtfs/ | Warsaw schedules/stops; optional alerts/positions | Index listed Warsaw during research. No fresh archive tested. Check service dates, calendar_dates, frequencies and attributions.txt. Static schedule is not a trip planner; vehicle IDs can differ from static trips. | Optional; simulate transfers initially |
| GIOŚ / https://api.gios.gov.pl/pjp-api/v1/rest/ | Station air observations | No key documented in old research; fresh response unverified. Archive documented at two requests/minute. Historic district interpolation is not live route exposure. Attribute GIOŚ. | Simulate route air score; fresh station context is stretch |
| Warsaw WMS / https://wms.um.warszawa.pl/serwis | Strategic modelled noise bands, 2022 | Old retrieval succeeded; fresh GetMap and reuse terms not checked. WMS colours are not exact live dB measurements. | Simulate preference score; modelled layer is stretch |
| Copernicus / https://land.copernicus.eu/ | Tree cover and Urban Atlas land use | Account/token, product terms, raster/GIS work and product year need checking. Earlier project used 2024 canopy and 2018 land use. No credentials or caches reused. | Defer; start with OSM park proximity proxy |
| SEWiK / https://obserwatoriumbrd.pl/mapa-wypadkow/ | Historical accidents | Earlier project used 2022–2024 records. Source/reuse restrictions need fresh review. Historical accidents are not live incidents. No raw participant/vehicle imports. | Defer; simulate current incidents |
| Panorama / https://warszawa.stat.gov.pl/ | District statistics | Earlier research used 2024 annexes. District context, not live route data. | Out of core scope |
| Routing provider | Street-following walking/cycling geometry | Delta chooses provider. No working integration established by source inspection. Verify attribution, key, modes, quota, geometry and fallback. | Essential check; illustrative geometry if unavailable |
| Tile/style provider | Map basemap | Alban chooses provider and checks keys, licence/attribution, network access and quotas. MapLibre is a renderer, not a tile supplier. | Essential check; recording fallback |

Do not invent exact city endpoint names for unverified event/roadwork datasets. Discover them from current catalogue entries.
No verified source is established for live traffic, charger occupancy, bookings, promotions, calendar or personal-device access.
Use labelled demo fixtures for those capabilities from the start. Unknown real-world opening hours remain unknown.

## Data labels and contract

Keep provenance per layer/input: source URL, source date, fetched time, licence/attribution, method and data kind.
Real, historical, estimated/proxy and simulated are different states. An overall “live” badge is misleading when a route mixes them.
Read contracts/README.md; agree changes with Delta and Alban, and update fixtures/schema together.
Source checks and detailed task assignments are in PLAN.md and TODO.md. Actual fetch results belong in docs/DATA.md.

References: [Vite](https://vite.dev/guide/), [FastAPI](https://fastapi.tiangolo.com/), [MapLibre](https://maplibre.org/maplibre-gl-js/docs/), [MCP SDK](https://py.sdk.modelcontextprotocol.io/), [pnpm installation/compatibility](https://pnpm.io/installation).
