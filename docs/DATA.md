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
| Warsaw open data: open sports fields | https://dane.um.warszawa.pl/api/action/get_be_otwarte_boiska + OSM Nominatim geocoding | CC-BY (city data) + ODbL (OSM geocoded coordinates) | Code ready; live geocoding blocked so far, see note below | 1227 raw records, 308 unique addresses to geocode | blocked | Sonia |

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
| Open sports fields | Sport | `get_be_otwarte_boiska` | weekly | **Geocoding built, live run blocked** — resource has no coordinates, only a street address (1227 records, 308 unique addresses). `backend/app/data/geocode.py` geocodes via OSM Nominatim (1 req/s, cached, single-threaded, per Nominatim's usage policy). See the geocoding note below |
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

Normalisation code: `backend/app/data/warsaw_open_data.py`. Committed sample (8 records per dataset): `data/fixtures/warsaw-open-data-sample.json`. Full raw response is cached at `data/local/warsaw_open_data_raw.json` (gitignored, event-time only, not committed — it also never contains the API key itself, only the data it unlocked).

Known limitations, recorded rather than hidden:
- Toilets have no native id in the source; `waw:toilet/<index>` is a synthetic id tied to fetch order, not a stable upstream identifier — do not treat it as durable across refetches.
- 300 of 652 events have no `map.features` entry (no coordinates); they are dropped by `normalise_events`, not placed at a guessed location.
- Rate limits for this API are undocumented; `fetch_action` uses bounded retries (3 attempts, 3s backoff) and the script sleeps 1s between the four datasets as a courtesy, not a confirmed requirement.

### Open sports fields: geocoding address → coordinates

The sports-fields resource has street addresses (`Adres obiektu`, `Dzielnica`) but no coordinates, unlike every other dataset fetched here. `backend/app/data/geocode.py` adds a small, cache-backed `Geocoder` that calls OSM Nominatim (`https://nominatim.openstreetmap.org/search`), and `normalise_sports_fields()` in `warsaw_open_data.py` geocodes each of the 308 distinct (address, district) pairs once and shares the result across every record at that address (a school often hosts several pitch types).

This follows Nominatim's usage policy (https://operations.osmfoundation.org/policies/nominatim/): single-threaded, max 1 request/second, a real identifying User-Agent, and mandatory result caching. It is excluded from `fetch_and_normalise_all()` by default (slow, ~5+ minutes for a full run) — call it explicitly or pass `--sports-fields` to the script.

**Live status as of 2026-10-17T14:21+0200: blocked, not fetched.** Every request from this development sandbox's network got HTTP 429 from Nominatim, including a single isolated request tried 20+ seconds after the first — this is the shared/sandboxed egress IP already being over Nominatim's public rate limit from aggregate traffic, not something our 1 req/s client-side pacing controls. The first implementation of the geocoder had a real bug here: it treated a 429 as "address not found" and cached that as a permanent miss, which produced a dishonest 56/1227 "success" rate that silently mislabeled real addresses as nonexistent. That is fixed — `geocode()` now retries 429/5xx with backoff and raises `GeocodingUnavailable` (not a cached "not found") if Nominatim never gives a definitive answer; `normalise_sports_fields()` catches that, stops cleanly, and keeps whatever was already geocoded. Verified by the offline tests in `backend/tests/test_geocode.py` and `backend/tests/test_warsaw_open_data.py` (mocked HTTP, no real network). A real committed sample still needs a run from a network Nominatim doesn't throttle — not completed in this PR.

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

## Fresh event-time data

Read STACK.md for source URLs, authentication, limits and simulation defaults. PLAN.md records earlier research, not guaranteed uptime. Fetch fresh event-time samples and append their results here; no private research repository or cache access is required. Record failures as well as successes.
