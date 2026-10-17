# Data and service catalogue

Sonia owns this catalogue; Delta approves service integrations.

| Dataset/service | Source URL | Licence/terms | Fetched at | Coverage/freshness | Mode | Owner |
| --- | --- | --- | --- | --- | --- | --- |
| Starter route | Repository fixture | Team-authored synthetic example | Not applicable | Straight-line illustration only | mock | Sonia |
| OSM places (Łazienki/Ujazdów demo area) | https://overpass-api.de/api/interpreter | ODbL; © OpenStreetMap contributors | 2026-10-17T13:11:18+0200 | One ~2km x 2km demo bounding box (`52.2060,21.0220,52.2250,21.0480`); 625 raw elements, 26 named places (museums, galleries, parks, named gardens) after dropping unnamed polygon fragments | real | Sonia |
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

## OSM places sample (DATA-01)

- Query: `way["leisure"="park"]`, `way["leisure"="garden"]`, `node["tourism"="museum"]`, `way["tourism"="museum"]`, `node["tourism"="gallery"]` inside the bbox above. See `backend/app/data/osm_places.py`.
- Fetched live from `overpass-api.de` on 2026-10-17 at 13:11:18 +0200 (first attempt succeeded after one earlier 502 and one timeout against the same endpoint — bounded retries worked as expected).
- Of 625 raw elements, 599 were unnamed `leisure=garden` polygon fragments (flower-bed-sized sub-areas within Łazienki Park). These were dropped in normalisation because they have no name to show on a place card, not because the source is distrusted — this is a documented, deliberate filter, not a data loss.
- 26 named places preserved: 12 parks, 6 museums, 3 galleries, 5 named gardens. Each keeps its OSM id (`osm:<type>/<id>`), name, longitude/latitude (node coordinates, or way centroid via Overpass `out center`), category, `opening_hours` (left `null` when the tag is absent — unknown stays unknown), and `website` when tagged.
- Committed sample: `data/fixtures/osm-places-sample.json` (26 records, ~10 KB). Full raw response is cached at `data/local/osm_places_raw.json` (gitignored, event-time only, not committed).
- Attribution required on any display: "© OpenStreetMap contributors" with a link to https://www.openstreetmap.org/copyright, per ODbL.
- Not yet integrated into `/api/routes` or a places endpoint — that is BE-02, which depends on this catalogue entry.

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

## Fresh event-time data

Read STACK.md for source URLs, authentication, limits and simulation defaults. PLAN.md records earlier research, not guaranteed uptime. Fetch fresh event-time samples and append their results here; no private research repository or cache access is required. Record failures as well as successes.
