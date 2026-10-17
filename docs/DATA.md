# Data and service catalogue

Sonia owns this catalogue; Delta approves service integrations.

| Dataset/service | Source URL | Licence/terms | Fetched at | Coverage/freshness | Mode | Owner |
| --- | --- | --- | --- | --- | --- | --- |
| Starter route | Repository fixture | Team-authored synthetic example | Not applicable | Straight-line illustration only | mock | Sonia |
| OSM places (Łazienki/Ujazdów demo area) | https://overpass-api.de/api/interpreter | ODbL; © OpenStreetMap contributors | 2026-10-17T13:11:18+0200 | One ~2km x 2km demo bounding box (`52.2060,21.0220,52.2250,21.0480`); 625 raw elements, 26 named places (museums, galleries, parks, named gardens) after dropping unnamed polygon fragments | real | Sonia |

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

## Fresh event-time data

Read STACK.md for source URLs, authentication, limits and simulation defaults. PLAN.md records earlier research, not guaranteed uptime. Fetch fresh event-time samples and append their results here; no private research repository or cache access is required. Record failures as well as successes.
