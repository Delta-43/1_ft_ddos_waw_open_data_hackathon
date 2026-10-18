# Data and service catalogue

Sonia owns this catalogue; Delta approves service integrations.

| Dataset/service | Source URL | Licence/terms | Fetched at | Coverage/freshness | Mode | Owner |
| --- | --- | --- | --- | --- | --- | --- |
| Demo routes (`route-response.json`) | Repository fixture | Team-authored synthetic example | Not applicable | Two straight-line routes; invented green/quiet scores, each labelled with which real dataset it could draw from once BE-01 exists (SIM-01) | mock | Sonia |
| Demo places (`places-response.json`) | Repository fixture | Team-authored; real names, approximate coordinates | Not applicable | Five central Warsaw places; no opening hours | mock | Sonia |
| OSM places (Łazienki/Ujazdów demo area) | https://overpass-api.de/api/interpreter | ODbL; © OpenStreetMap contributors | 2026-10-17T16:19:06+0200 | One ~2km x 2km demo bounding box (`52.2060,21.0220,52.2250,21.0480`); 1124 raw elements, 75 named places (museums, galleries, parks, named gardens, historic buildings/castles/churches/ruins) after dropping unnamed fragments and low-value historic tags | real | Sonia |
| Warsaw open data: air quality | https://dane.um.warszawa.pl/api/action/get_bopipk_monitoring_jakosci_powietrza | CC-BY; Urząd m.st. Warszawy | 2026-10-17T13:57:14+0200 | 141 monitoring stations city-wide, live readings | real | Sonia |
| Warsaw open data: AED locations | https://dane.um.warszawa.pl/api/action/get_scb_lokalizacja_defibrylatorow | CC-BY; Urząd m.st. Warszawy | 2026-10-17T13:57:14+0200 | 710 defibrillators city-wide | real | Sonia |
| Warsaw open data: public toilets | https://dane.um.warszawa.pl/api/action/get_m_toalety | CC-BY; Urząd m.st. Warszawy | 2026-10-17T13:57:14+0200 | 695 facilities city-wide, source has no stable id (synthesised from array index) | real | Sonia |
| Warsaw open data: events calendar | https://dane.um.warszawa.pl/api/action/get_bmm_kalendarz_wydarzen | CC-BY; Urząd m.st. Warszawy | 2026-10-17T13:57:14+0200 | 652 raw events, 352 kept with a resolvable map point (300 dropped: no coordinates, not guessed) | real | Sonia |
| Warsaw open data: open sports fields | https://dane.um.warszawa.pl/api/action/get_be_otwarte_boiska + OSM Nominatim geocoding | CC-BY (city data) + ODbL (OSM geocoded coordinates) | City data fetched 2026-10-17T14:21:49+0200; geocoding not completed, see note below | 1227 raw records fetched; 308 unique addresses, 0 successfully geocoded so far | blocked | Sonia |
| Historical map overlays (1935/1939/1945) | https://wms.um.warszawa.pl/serwis | Fee-exempt, mandatory attribution under Polish PSI reuse law (ustawa o otwartych danych); © Urząd m.st. Warszawy, Biuro Architektury i Planowania Przestrzennego | 2026-10-17T18:45:58+0200 | 3 bounded raster images over central Warsaw (1935 aerial photo, 1939 city plan, 1945 aerial photo of the destroyed city), each verified to render a real image | real | Sonia |
| Simulated environment and disruptions (`simulated-environment.json`, SIM-01) | Repository fixture | Team-authored invented values; each category's entry records the real source it could draw from once integrated (Warsaw WMS noise layers, the real air-quality layer, no live traffic/incident/roadworks source checked) | Not applicable | Noise, route air score, traffic, incidents, roadworks - 2 samples each except incidents/roadworks (1 each); not wired into any API response, no contract field exists for these yet | simulated | Sonia |
| Simulated events/profile/charging (`simulated-events-profile-charging.json`, SIM-02) | Repository fixture | Team-authored fictional records, kept distinct from the real committed events dataset above | Not applicable | 2 fictional events, 1 fictional demo persona (no real account/calendar/habit data), 2 fictional EV charging stations; not wired into any API response | mock | Sonia |

For each import, retain source identifiers, normalise coordinates, and record missing fields.
Do not commit personal calendars, habits, tokens, or a real user's location history.
SQLite holds city data only, never user profiles, preferences, trip history or achievements. Personal data stays on the user's device (IDEA.md, Privacy and security).
Use bounded HTTP timeouts and a cached/fixture fallback. External-service checks are manual, not required CI.
The starter fixture is not a museum catalogue or navigable street route.

## OSM places sample (DATA-01, extended by DATA-05)

- Query: `way["leisure"="park"]`, `way["leisure"="garden"]`, `node["tourism"="museum"]`, `way["tourism"="museum"]`, `node["tourism"="gallery"]`, `node["historic"]`, `way["historic"]` inside the bbox above. See `backend/app/data/osm_places.py`.
- Fetched live from `overpass-api.de` on 2026-10-17 at 16:19:06 +0200 (first attempt hit a 502, bounded retry succeeded).
- Of 1124 raw elements: 1049 were dropped. Most (same as DATA-01) are unnamed `leisure=garden` polygon fragments. Of the named ones, two `historic=*` values were dropped unless the element also carried a genuine `tourism`/`leisure` tag: `historic=memorial` (~90 records — individual commemorative plaques/statues scattered through Łazienki Park, e.g. one per notable person with a bench or bust) and `historic=yes` (~45 records — an ambiguous tag that could describe almost anything, including several embassy buildings). Neither is a place worth its own card on a museum/park outing. This mirrors DATA-01's unnamed-garden filter: a documented usefulness decision, not distrust of the source.
- 75 named places preserved (up from 26): 12 parks, 6 museums, 3 galleries, 5 named gardens (all DATA-01), plus from DATA-05: 24 `historic=building`, 10 `tourism=artwork`, 5 `historic=castle`, 4 `tourism=attraction`, 2 `tourism=information`, 2 `historic=ruins`, 1 `historic=church`, 1 `historic=manor`. A handful of `artwork`/`attraction` records (e.g. a Chopin statue, sundials, two spring/fountain features) are kept because they carry a genuine `tourism` tag even though they also happen to be tagged `historic=memorial` — tourism takes priority over historic in categorisation, which is correct: these are real small attractions, not just a name plaque.
- Known limitation: `historic=building` is a broad OSM value. Most of the 24 are genuine Łazienki-complex structures (the old Orangery, the Astronomical Observatory and its wings, the royal stables), but at least one (an outpatient psychiatric day ward building) is not touristically interesting — it is simply a building that happens to sit on land tagged historic. Not hand-curated further; this is the kind of individual-record judgement call that is better made per-route than by excluding real OSM data wholesale.
- Committed sample: `data/fixtures/osm-places-sample.json` (75 records, ~28 KB). Full raw response is cached at `data/local/osm_places_raw.json` (gitignored, event-time only, not committed).
- Attribution required on any display: "© OpenStreetMap contributors" with a link to https://www.openstreetmap.org/copyright, per ODbL.
- Integrated into `GET /api/places` (BE-02): `backend/app/data/catalogue.py` maps these 75 places to the contract's `Place` shape. `museum`→`museum`; `park`/`garden`→`park`; `castle`/`church`/`manor`/`ruins`/`building`→`landmark`; `gallery`/`artwork`/`attraction`/`information`→`generic` (the contract's `PlaceCategory` enum is only museum/landmark/park/generic; nothing here is stretched into a category without the contract owners agreeing to widen the enum). `address` is `null` for every place — the OSM query this sample used didn't request `addr:*` tags. Response `mode` is `cached`. Not yet integrated into `/api/routes`, which is BE-01.

## Warsaw open data portal catalogue (DATA-04)

Catalogue discovery needs no key: `GET https://dane.um.warszawa.pl/api/datasets?page=1&size=50&lang=en` (the JSON API behind the portal's own `/catalogue` page) listed all 23 currently published datasets on 2026-10-17. Every dataset resource itself needs a key: `POST https://dane.um.warszawa.pl/api/action/<endpoint>` with a raw `Authorization: <token>` header — not `Bearer <token>`, confirmed against the portal's own published call examples. The key lives in `.env` as `DANE_WWA_API_KEY` (not committed; `.env.example` documents the variable name only).

Full catalogue, with the actual action endpoint and whether it was fetched for this project:

| Dataset | Category | Endpoint | Refresh | Status |
| --- | --- | --- | --- | --- |
| Air quality measurements | Environment | `get_bopipk_monitoring_jakosci_powietrza` | 10 minutes | **Fetched** — environmental score input, replaces part of the simulated GIOŚ proxy with a real city source |
| AED Locations | Health | `get_scb_lokalizacja_defibrylatorow` | daily | **Fetched** — safety amenity for place cards |
| Database of toilets available to residents | Environment | `get_m_toalety` | weekly | **Fetched** — practical amenity for a walking outing |
| Events Calendar | Events | `get_bmm_kalendarz_wydarzen` | 2 hours | **Fetched** — cultural events, relevant to a museum outing; records without a map point are dropped, not guessed |
| Open sports fields | Sport | `get_be_otwarte_boiska` | weekly | **Fetched (1227 records, 2026-10-17T14:21:49+0200); geocoding blocked** — resource has no coordinates, only a street address (308 unique addresses). `backend/app/data/geocode.py` geocodes via OSM Nominatim (1 req/s, cached, single-threaded, per Nominatim's usage policy). See the geocoding note below |
| Na żądanie (tourist routes) | Active residents | `get_sbt_trasy_turystyczne` | on request | Catalogued only — sounds relevant (tourist routes) but not inspected this pass; candidate for a follow-up issue |
| Weather | Environment | `get_zom_pogoda` | 10 minutes | Catalogued only — context data, lower priority than air quality for the demo |
| Public Transport Stop Locations | Public transport | `get_ztm_przystanki_komunikacji_miejskiej` | daily | Catalogued only — **Delta's routing/transit territory** (BE-01), not fetched here |
| Lines available at the stop | Public transport | `get_ztm_lista_linii_na_przystanku` | daily | Catalogued only — Delta's territory |
| Line departures from the stop | Public transport | `get_ztm_odjazdy_linii_z_przystanku` | daily | Catalogued only — Delta's territory |
| Location of public transport vehicles | Public transport | `get_ztm_lokalizacja_pojazdow` | 10 seconds | Catalogued only — Delta's territory |
| Public transport vehicles | Public transport | `get_ztm_pojazdy` | daily | Catalogued only — Delta's territory |
| Available parking spaces | Public transport | `get_m_parkingi_wolne_miejsca` | 1 minute | Catalogued only — not relevant to a walking/park outing |
| Road construction disruptions | Public transport | `get_bin_utrudnienia_drogowe` | 1 minute | Catalogued only — relevant to DATA-09 (Delta, timeboxed), not fetched here |
| Sports activities | Sport | `get_bmm_zajecia_sportowe` | 2 hours | Catalogued only — organised sport classes, not a fit for this outing scenario |
| Waste segregation | Environment | `get_bmm_segregacja_odpadow` | daily | Catalogued only — out of scope for the demo |
| Segregation of waste types | Environment | `get_bmm_typy_odpadow` | daily | Catalogued only — out of scope |
| Eco-points | Environment | `get_bos_ekopunkty` | weekly | Catalogued only — recycling drop-off points, not a fit |
| Real Estate Price Register | Real Estate | `get_bgk_rcn` | daily | Catalogued only — out of core scope (PLAN.md already excludes housing data) |
| Public consultations | Active residents | `get_cks_konsultacje_spoleczne` | 2 hours | Catalogued only — out of scope |
| Public consultation categories | Active residents | `get_cks_konsultacje_spoleczne_kategorie` | 2 hours | Catalogued only — out of scope |
| Public consultations districts | Active residents | `get_cks_konsultacje_spoleczne_dzielnice` | 2 hours | Catalogued only — out of scope |
| Participatory budget | Active residents | `get_cks_budzet_obywatelski` | weekly | Catalogued only — out of scope |

Normalisation code: `backend/app/data/warsaw_open_data.py`. Committed sample (8 records per dataset, fetched 2026-10-17T13:57:14+0200): `data/fixtures/warsaw-open-data-sample.json`. As of DATA-03 this also includes a `sports_fields` entry with 8 raw (un-geocoded, no coordinates) records from the 2026-10-17T16:58:49+0200 fetch, as independently-verifiable evidence for the 1227-record count — distinct from `sample_places` used by the other four datasets since these records have no `longitude`/`latitude` yet. Full raw response for all five is cached at `data/local/warsaw_open_data_raw.json` (gitignored, event-time only, not committed — it also never contains the API key itself, only the data it unlocked).

Known limitations, recorded rather than hidden:
- Toilets have no native id in the source; `waw:toilet/<index>` is a synthetic id tied to fetch order, not a stable upstream identifier — do not treat it as durable across refetches.
- 300 of 652 events have no `map.features` entry (no coordinates); they are dropped by `normalise_events`, not placed at a guessed location.
- Rate limits for this API are undocumented; `fetch_action` uses bounded retries (3 attempts, 3s backoff) and the script sleeps 1s between the four datasets as a courtesy, not a confirmed requirement.

### Open sports fields: geocoding address → coordinates

The sports-fields resource has street addresses (`Adres obiektu`, `Dzielnica`) but no coordinates, unlike every other dataset fetched here. `backend/app/data/geocode.py` adds a small, cache-backed `Geocoder` that calls OSM Nominatim (`https://nominatim.openstreetmap.org/search`), and `normalise_sports_fields()` in `warsaw_open_data.py` geocodes each of the 308 distinct (address, district) pairs once and shares the result across every record at that address (a school often hosts several pitch types).

This follows Nominatim's usage policy (https://operations.osmfoundation.org/policies/nominatim/): single-threaded, max 1 request/second, a real identifying User-Agent, and mandatory result caching. It is excluded from `fetch_and_normalise_all()` by default (slow, ~5+ minutes for a full run) — call it explicitly or pass `--sports-fields` to the script.

**Live status as of 2026-10-17T14:21+0200: the 1227-record city dataset itself fetched successfully (that part needs no geocoding); geocoding addresses into coordinates is blocked.** Every request from this development sandbox's network got HTTP 429 from Nominatim, including a single isolated request tried 20+ seconds after the first — this is the shared/sandboxed egress IP already being over Nominatim's public rate limit from aggregate traffic, not something our 1 req/s client-side pacing controls. The first implementation of the geocoder had a real bug here: it treated a 429 as "address not found" and cached that as a permanent miss, which produced a dishonest 56/1227 "success" rate that silently mislabeled real addresses as nonexistent. That is fixed — `geocode()` now retries 429/5xx with backoff and raises `GeocodingUnavailable` (not a cached "not found") if Nominatim never gives a definitive answer; `normalise_sports_fields()` catches that, stops cleanly, and keeps whatever was already geocoded. Verified by the offline tests in `backend/tests/test_geocode.py` and `backend/tests/test_warsaw_open_data.py` (mocked HTTP, no real network). A real committed sample still needs a run from a network Nominatim doesn't throttle — not completed in this PR.

## Kickoff source gate (DATA-02): remaining STACK.md sources

Checked 2026-10-17, ~14:40–14:55 Europe/Warsaw. OSM places (DATA-01) and one official Warsaw dataset (DATA-04) are already verified above; this covers the rest of STACK.md's source table that falls in Sonia's lane (environmental/disruption context for SIM-01). Routing and tile providers are Delta's/Alban's to check, not repeated here.

| Source | Reachable? | Classification | Notes |
| --- | --- | --- | --- |
| GIOŚ air quality (`api.gios.gov.pl/pjp-api/v1/rest/`) | Yes, HTTP 200, no key needed | **Deferred — redundant** | `station/findAll` lists 288 stations nationally, only **10** in Warsaw. The city portal's own air-quality dataset (already integrated, DATA-04) has **141** Warsaw stations, needs no separate rate-limit handling (GIOŚ documents 2 req/min), and we already hold a working key for it. Not worth a second, weaker air-quality source for this demo. |
| Warsaw WMS noise (`wms.um.warszawa.pl/serwis`) | Yes, HTTP 200 `GetCapabilities` | **Verified real, not yet integrated** | 213 layers. Confirmed noise layers for road/rail/air/industrial/tram, each as `_LDWN` (day-evening-night) and `_LN` (night) variants, for **2017 and 2022** — e.g. `HALAS_DROGOWY_LN_2022`. This is WMS only (checked — `SERVICE=WFS` on the same endpoint just returns the WMS capabilities again), so it serves rendered map tiles via `GetMap`, not queryable vector geometry; a per-point noise score would need `GetFeatureInfo` at a pixel, which was not tested. Matches STACK.md's warning: modelled 2022 bands, not live dB — usable as labelled "modelled" context, not as a measured score. A SIM-01 fixture can reference this as its real basis instead of being invented from nothing. |
| Warsaw WMS greenery layers (same service, bonus find) | Yes (part of the same capabilities document) | **Catalogued only — not my issue's scope** | The same WMS exposes `ZIELEN_DRZEWA` (trees), `ZIELEN_GRUPY_DRZEW` (tree groups), `ZIELEN_TRAWNIKI` (lawns), `ZIELEN_POMNIKI_PRZYRODY` (natural monuments), etc. Same WMS-only caveat as noise (no WFS). Flagging for whoever picks up DATA-07 (greenery proxy, Delta+Alban) — this may be a better/denser source than OSM park polygons alone, but integrating it is out of my file boundary for this issue. |
| GTFS (`mkuran.pl/gtfs/warsaw.zip`) | Yes, HTTP 200, ~95 MB zip | **Catalogued only — Delta's territory (DATA-09)** | Confirms PLAN.md's size warning (previously reported 549 MB uncompressed `stop_times`). Not parsed here; transit/routing data is Delta's ownership, not Sonia's place/environmental data. |
| Copernicus tree cover / Urban Atlas, SEWiK accidents, Panorama demographics | Not re-checked | **Deferred, per PLAN.md** | No new information this pass — PLAN.md's existing assessment (account/token or reuse-terms friction, historical/stale data, out of core scope) stands. Not worth spending source-gate time on these given the freeze is approaching. |

Organiser data rules: not separately reconfirmed this pass — see PLAN.md's existing note that this was last addressed at research time (16 October), not re-verified live with organisers during this session.

## Environmental and disruption demo fixtures (SIM-01)

`data/fixtures/route-response.json`'s `green_score`/`quiet_score` metrics were sharing one generic `fixture-scores` source. Split into `sim-green-score` and `sim-quiet-score`, each labelled `mode: "simulated"` with a `method` that names the real input that exists but isn't wired up yet, instead of a flat "invented values" note:

- `sim-green-score`: references the real OSM park/garden sample (DATA-01, `data/fixtures/osm-places-sample.json`) as a future proximity-proxy input. Still invented — BE-01's scoring service doesn't read it.
- `sim-quiet-score`: references the real Warsaw WMS noise layers (DATA-02, `HALAS_DROGOWY_LN_2022` etc.) as a future modelled-noise input. Still invented — the WMS is raster/`GetMap` only, no confirmed per-point query, and BE-01 doesn't read it either.

This satisfies "visibly simulated, no fake measured dB or implied live readings" more precisely than a single generic source: a reader of `sources[]` now sees exactly which real dataset each simulated score *could* eventually draw from, without implying it already does.

**Traffic, incidents and roadworks are not in `contracts/api.schema.json` at all** — there is no `Route` or `PlacesResponse` field for them. Rather than inventing new JSON fields the contract owners (Delta + Alban) haven't agreed to, or fabricating a disruptions fixture with nowhere in the schema to put it, this is flagged as an open question: do we want a contract field for route disruptions before BE-01 lands, or is a mention inside `Route.explanation` text enough for the demo? Current routes are also `geometry_kind: "straight_line"` (illustrative only, not navigable), so a roadwork-on-this-exact-path disruption wouldn't mean much until BE-01 adds real street geometry — simulating it now would be simulating a problem that doesn't exist yet for the current fixture. Deferred, not silently dropped.

## Cache and documentation audit (DATA-03)

Checked 2026-10-17 ~16:57–17:10 Europe/Warsaw: every real dataset row above against its actual committed/cached file, verifying source URL, fetch date, licence/attribution and record count are all present and match.

- OSM places (`osm-places-sample.json`): confirmed `fetched_at`, `source_url`, `licence`, `raw_record_count` (1124) and `named_place_count` (75) in the file exactly match this document's row.
- Warsaw open data (`warsaw-open-data-sample.json`): confirmed `fetched_at`, `source_url`, `attribution`, and per-dataset `raw_record_count`/`normalised_count` for air quality (141/141), AED (710/710), toilets (695/695) and events (652/352) all match.
- Fixed one precision gap: the open-sports-fields row previously said "Code ready; live geocoding blocked so far" for *fetched at*, conflating two different things — the raw 1227-record city-data fetch actually succeeded (it needs no geocoding), only the address→coordinate enrichment is blocked. Now states the real fetch timestamp (2026-10-17T14:21:49+0200) separately from the geocoding status.
- Added a committed `sports_fields` entry (8 raw, un-geocoded records, fetched 2026-10-17T16:58:49+0200) to `warsaw-open-data-sample.json` so the "1227 records" claim is independently checkable from the repo, not just this document's prose — previously only the four geocode-free datasets had committed evidence.
- No old-project assets were found or copied anywhere in `data/` — every committed sample traces to a fetch timestamp recorded in this document from this event, consistent with SETUP.md/PLAN.md's "recreate on Saturday" rule.
- `data/local/` (gitignored, event-time caches): currently holds `osm_places_raw.json` and `city.db` (both regenerable). `warsaw_open_data_raw.json` and `geocode_cache.json` are also gitignored and regenerate on demand via `python -m app.data.warsaw_open_data` / `--sports-fields`; their absence at any given moment doesn't affect the committed record, since the committed fixtures are the durable evidence.

## Provider-failure and fallback testing (DATA-10, backend slice)

DATA-10's full acceptance ("stop each provider in turn and run the demo") needs an integrated frontend demo, which doesn't exist yet (INT-01, #14, is still blocked on FE-01). This covers the part that's testable from the backend alone: does the contract stay stable, with simulation labels intact, when a provider or cache is unavailable?

- **OSRM routing outage**: already covered thoroughly by BE-01's own test suite (`backend/tests/test_planner.py::test_routing_outage_falls_back_to_labelled_straight_lines`), and by `conftest.py`'s autouse `offline_routing` fixture, which makes "OSRM is down" the default condition for every test in the suite unless a test explicitly fakes a response. Confirmed: falls back to straight-line geometry, `mode: "mock"`, honest notice, `straight-line` source labelled `simulated`. Nothing duplicated here.
- **`/api/places` and `/api/layers` never call a live external provider at request time** — they read `app.db`'s SQLite store, built from committed fixtures (plus an optional gitignored full cache). So their "provider failure" surface is local-cache resilience, tested in `backend/tests/test_resilience.py`:
  - `city.db` missing (gitignored, and `db.py`'s own docstring calls it "safe to delete") → both endpoints rebuild it transparently and return valid, contract-matching data. **Pass.**
  - The full open-data cache (`data/local/warsaw_open_data_raw.json`, also gitignored — absent on a fresh checkout or a teammate's machine) missing → the build falls back to the committed 8-record sample and says so honestly in the source's `method` text, rather than silently claiming the full dataset. **Pass.**
  - `city.db` present but corrupted (not a valid SQLite file) → **fails**: `app.db.connect()` only checks the file's age against its fixtures, never that it's actually readable, so a corrupted-but-newer file produces an unhandled `sqlite3.DatabaseError` → 500, not a graceful fallback. Captured as `test_corrupted_db_does_not_crash_the_places_endpoint`, marked `xfail(strict=True)` so it documents the gap without failing CI. `backend/app/db.py` is Delta's file (outside this issue's `backend/tests/`+docs boundary), so this is flagged, not fixed, here — filed as [#56](https://github.com/Delta-43/1_ft_ddos_waw_open_data_hackathon/issues/56).

## Historical map layers (1930s–40s Warsaw)

Checked 2026-10-17 in response to a "could we show the historic city shape" question. The same `wms.um.warszawa.pl/serwis` WMS server already catalogued above (DATA-02, noise/greenery) also carries a rich set of historical layers, confirmed reachable and real:

| Layer | What it is |
| --- | --- |
| `HISTORIA_GRANICA_1916`/`1930`/`1938`/`1939_1945`/`1951`/`1957`/`1977`/`1992` | Warsaw city-boundary outline for each year — confirmed by rendering `HISTORIA_GRANICA_1930` and visually comparing to the modern extent (noticeably smaller, as expected pre-1951 annexation) |
| `HISTORIA_ULICE_1939` | 1939 street network |
| `RASTER_PLAN_1939` | Georeferenced scanned 1939 city plan |
| `RASTER_FOTOPLAN_1935` | 1935 aerial orthophoto |
| `RASTER_ORTOFOTO_1945` | 1945 aerial orthophoto (reportedly built from Soviet reconnaissance photography of the post-uprising, heavily destroyed city) |
| `MPZP_OBIEKTY_WPISANE_DO_REJESTRU_ZABYTKOW` / `MPZP_BUDYNKI_WPISANE_DO_REJESTRU_ZABYTKOW` | Current official heritage/monument register |
| `MPZP_GRANICE_OBSZAROW_OBJETYCH_OCHRONA_KONSERWATORSKA` | Heritage-conservation-zone boundaries |

**Render-only, not queryable — tested, not assumed.** Capabilities marks `HISTORIA_GRANICA_1930` `queryable="true"`, but `GetFeatureInfo` returns an empty-but-valid `<GetFeatureInfo_Result>` for every request tried: WMS 1.1.1 and 1.3.0, `text/xml`/`text/html`/default `INFO_FORMAT`, at a point confirmed (by rendering the exact same bbox) to sit dead-centre on the rendered line. As a control, the same request pattern against the `ORTO` basemap layer returned a real Oracle MapViewer server error instead of a silent empty result, confirming the server does process these requests — `HISTORIA_GRANICA_1930` and likely its sibling layers simply have no attribute data exposed for query, a known Oracle MapViewer pattern for cartographic-only themes. **Conclusion: usable as a raster overlay (fade/opacity-slider between the modern basemap and a historical year, the same pattern used by existing sites like staremapy.waw.pl), not usable for "is this point inside the 1930 boundary" style vector queries** without separately digitising the boundary or finding it as real vector data elsewhere (OpenHistoricalMap — `overpass-api.openhistoricalmap.org` — was not checked for Warsaw coverage and is the obvious next place to look if a vector boundary becomes a requirement).

**Rich per-building historical context**: not a new data source, an extension of what's already fetched. OSM frequently tags historic buildings with `wikipedia`/`wikidata`/`start_date`, which DATA-05's query doesn't currently request. Adding those tags, then resolving `wikipedia` values through Wikipedia's free `pl.wikipedia.org/api/rest_v1/page/summary/<title>` REST endpoint (no key), would give an AI-ready paragraph per landmark already in `osm-places-sample.json`. `fotopolska.eu` and `warszawa1939.pl` have much richer crowdsourced archival photography for this era but are browse-only websites, not APIs — useful for manual pitch-deck material, not a live integration. **Not built in this pass** — a candidate follow-up if the team wants it.

### Overlay MVP: implemented

Built the opacity-overlay idea above: a single bounded image per year (1935 aerial photo, 1939 city plan, 1945 aerial photo of the destroyed city), toggled on the map. Deliberately skipped the `HISTORIA_GRANICA_*` boundary-line layers for v1 — thin lines have little value as a visual backdrop; the three raster photos/plans are the ones worth seeing.

- **Backend** (`backend/app/data/historical_layers.py`): builds a `CRS:84` `GetMap` URL per layer over a fixed central-Warsaw bbox (`20.95,52.19,21.08,52.28` — Stare Miasto, the river, city centre, Łazienki/Ujazdów), with a `Source` entry (`mode: "real"`, honest about the render-only limitation in its `method` text). Run as `python -m app.data.historical_layers` to re-verify each URL actually renders a real image (not an error page) and regenerate the committed `data/fixtures/historical-layers.json`.
- **No new REST endpoint.** This isn't personalised or filtered — always the same 3 layers, same bbox — so it's treated the same way the base tile/style provider already is (STACK.md: a frontend-config concern, not backend-served city data), not routed through `/api/places`-style request/response contract negotiation.
- **Frontend** (`frontend/src/map/historicalOverlay.ts` + `historicalOverlayControl.ts`): a MapLibre `image` source per year plus a cycling toggle control (off → 1935 → 1939 → 1945 → off), following the same `IControl` pattern as the existing reset-view button. `frontend/src/data/historicalLayers.json` mirrors the backend fixture (regenerate both together); `resolveJsonModule` added to `frontend/tsconfig.json` to allow the JSON import.
- **Layer ordering, found by testing, not assumed**: the game-map style's ground/park/water fills are fully opaque, so a layer added in the "natural" position (just above `background`) renders completely hidden underneath them — confirmed by inspecting `map.getStyle().layers` live, not by guessing. Fixed by adding the overlay with no `beforeId` (on top of the whole style) at `raster-opacity: 0.75`, which reads as a translucent "ghost" of the old city over the modern 3D map — a nicer effect than hiding the modern layers would have been anyway.
- **Race condition, found by testing, not assumed**: the toggle button is clickable as soon as the map control mounts, before the style's `load` event fires (when the image source/layer actually get registered). An early click updated the button's internal state but the visual change was silently lost, with nothing to re-sync it afterwards. Fixed by having the control own the overlay's lifecycle directly — it re-applies its current selection once the style is confirmed loaded, so a click before `load` still ends up correct instead of looking like a dead button.
- Verified live end-to-end in a browser (not just unit-tested): fresh page load, immediate click on the toggle, all three years cycle correctly, image aligns precisely with the modern map (river bends, city extent match), no console errors.
- **Attribution is now shown on screen** while a historical year is active (not just recorded in the API response), per Delta's #74 review — see `HistoricalOverlayControl`'s label.
- **Reuse terms, checked not assumed** (per Delta's #74 review): [architektura.um.warszawa.pl/warunki-ponownego-wykorzystania](https://architektura.um.warszawa.pl/warunki-ponownego-wykorzystania) (the Biuro Architektury i Planowania Przestrzennego's own terms page — the same office that owns these WMS layers per their `Abstract`) explicitly lists `ortofotomapy` (orthophotomaps) as fee-exempt, and states reuse is free "niezależnie od celu" (regardless of purpose) under Polish public-sector-information reuse law — no commercial restriction stated. This covers `RASTER_FOTOPLAN_1935` and `RASTER_ORTOFOTO_1945` directly (both literally orthophotomaps); `RASTER_PLAN_1939` (a scanned city plan, not an orthophoto) isn't explicitly named in that fee-exempt list but comes from the same office under the same general terms. Attribution is mandatory: source ("Urząd m.st. Warszawy"), the data's creation date, and when it was obtained — all three are in the on-screen label and the `Source.method` text. No formal licence name (CC-BY, ODbL, etc.) is stated, only the statutory reuse right.

Frontend ownership note: `frontend/src/map/README.md` says "Alban owns MapLibre integration... here." This was built with Delta's and the user's explicit sign-off for this specific piece, kept to small new files plus a 1-line control registration and a 2-line import change in `createMap.ts` (no edits to `style.ts`, `controls.ts`, or `MapView.tsx`) specifically to stay reviewable and out of Alban's active work. Flagged for his review regardless.

### Unresolved: map sometimes never finishes loading with this control registered

Work on this paused here, handed to the frontend pair rather than debugged further solo. Found late, by continued testing, not assumed fixed:

- The three bugs described above (invisible layer ordering, toggle race condition, re-entrant `map.addControl` breaking the attribution label) were each found and fixed by testing live in a browser, and each fix was individually verified working.
- After the third fix, repeated testing (multiple clean server restarts, a fresh browser tab, waiting 40+ seconds) showed `map.isStyleLoaded()` staying `false` indefinitely and `historical-layer-warsaw_1935` never getting added — i.e. the map's `load` event appears to never fire with `HistoricalOverlayControl` registered. Visually the page shows the UI chrome (top bar, chat prompt, zoom controls) but the 3D city never renders.
- Not yet isolated as a code bug versus environment/resource exhaustion from many repeated test reloads in one long session (a plausible alternative: MapLibre/WebGL context accumulation across dozens of navigations). A clean A/B test (same session, same restart, control registered vs. commented out) was started but not completed before this work was paused.
- **Next step for whoever picks this up**: in `frontend/src/map/createMap.ts`, comment out the `map.addControl(new HistoricalOverlayControl(), 'top-right')` line, hard-restart the dev server and browser (not just hot-reload), and confirm the map loads normally without it. If it does, the bug is somewhere in `historicalOverlayControl.ts`/`historicalOverlay.ts` (candidates: the `map.on('error', ...)` listener, or `HistoricalAttributionLabel`'s `map.getContainer().append(...)` call interacting badly with MapLibre's resize/canvas handling) and needs further isolation line by line. If the map also fails to load without the control, this isn't caused by this PR at all and is worth raising separately.
- All backend code, docs and tests in this PR are verified working and unaffected by this; the three fixes already made are real fixes, not reverted. It's specifically "does the map ever finish loading with this control present" that's unresolved.

## Fresh event-time data

Read STACK.md for source URLs, authentication, limits and simulation defaults. PLAN.md records earlier research, not guaranteed uptime. Fetch fresh event-time samples and append their results here; no private research repository or cache access is required. Record failures as well as successes.

## Greenery and quiet proxy method (DATA-07)

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

**UI rule (for #26 with Alban):** any display of these scores must show the "Proxy" label from `SourceLabel` and may say "greenery estimate" or "traffic-exposure estimate". It must not say measured, shade, canopy or noise level. A better greenery source exists but is not integrated: the Warsaw WMS layers `ZIELEN_DRZEWA`, `ZIELEN_TRAWNIKI` and others (see DATA-02 above), which are map tiles only. Modelled WMS noise (2022) could later replace the quiet proxy, labelled as modelled.

**Sanity check (live run, 2026-10-17):** for the same museum outing, the route inside parks scored green 0.53 / quiet 0.64, the route through parks 0.12 / 0.56 and the direct route 0.00 / 0.46. The ordering matches the intent; the absolute values mean nothing on their own.
## Stale live-feed rule

A feed that answers is not a feed that is current. Vehicle locations, departures and station readings can stop updating during repairs, holdbacks or technical stops. Rule for every live-style input (implemented in `backend/app/services/freshness.py`):

- Judge each record by its own timestamp. More than 30 minutes old, missing, unreadable or in the future means **not live**.
- Show such records as "last seen HH:MM" or leave them out. Never draw them as live, never extrapolate their position, and never fill the gap with a guess.
- Show `retrieved_at` and the record's own update time next to any "live" claim in the UI and the pitch.
- Status today: no vehicle-position or departure feed is integrated (DATA-09 deferred them), so only the air-quality layer is affected. Its features carry `properties.freshness`, and the committed cached readings are correctly reported as stale. If a live transit feed is added later it must use `split_live`.
## Routing provider verification (DATA-06)

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

## Optional source checks: events, roadworks, GTFS (DATA-09)

Timeboxed to 30 minutes, run 2026-10-17 from 18:14 +02:00 by Delta. Rule applied: integrate only verified, useful responses; otherwise keep the labelled simulation or defer.

| Source | Result | Decision |
| --- | --- | --- |
| Events calendar (`get_bmm_kalendarz_wydarzen`) | Already fetched by DATA-04 and served as the `events` layer. The 8 committed sample events all start between 2026-12-04 and 2027-01-29, so none falls on the demo weekend. The full 352 placed events were not re-inspected in this check | **Keep as a map layer**, labelled cached. Do not claim "events today" in the pitch |
| Road construction disruptions (`get_bin_utrudnienia_drogowe`) | Listed in the portal catalogue (`utrudnienia-w-ruchu-drogowym`, refresh 1 minute, last metadata change 2026-06-01). **Response not fetched**: the dataset needs `DANE_WWA_API_KEY` and no key is set on the shared server host | **Defer.** Roadwork disruptions stay a labelled simulation (SIM-01). Re-check only if Sonia runs the fetch with her key before the freeze |
| GTFS (`https://mkuran.pl/gtfs/warsaw.zip`) | Reachable, HTTP 200, 99.8 MB, `Last-Modified` 2026-10-16 23:03 UTC. Read the zip directory with range requests without downloading the file. `feed_info`: feed version 2026-10-17 00:15:22, publisher Mikołaj Kuranowski. 7,246 stops, 329 routes; `stop_times.txt` is 511.8 MB unzipped | **Defer.** Real and fresh, but full multimodal routing is out of scope (AGENTS.md) and `stop_times` is too large to parse for the demo. A stops-only layer (0.6 MB `stops.txt`) is possible later; it adds nothing to a quiet museum walk |

Not verified: GTFS licence/terms (check `attributions.txt` and the publisher page before any reuse), the content of the roadworks response, and event dates beyond the committed sample. The dependency on INT-01 (#14) was not met when this ran; nothing was integrated, so it does not matter.
