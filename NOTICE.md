# Data, services and fonts

Find YOUR way uses the third-party data, services and fonts below. The app shows the credits on screen
(bottom left, and in each card); this file lists them in full.

| What | Where it is used | Licence or terms | Credit |
| --- | --- | --- | --- |
| OpenStreetMap: places, parks, buildings, trees, toilets, defibrillators, shops, culture tags | `frontend/public/corridor-cache.json`, `data/fixtures/osm-*.json` | [ODbL 1.0](https://opendatacommons.org/licenses/odbl/) | © OpenStreetMap contributors, https://www.openstreetmap.org/copyright |
| Vector map tiles | Basemap, loaded at run time | [OpenFreeMap](https://openfreemap.org) (free, no key); OpenMapTiles schema | OpenFreeMap, © OpenMapTiles, data © OpenStreetMap contributors |
| Street routing (walking and cycling) | `backend/app/services/routing.py`; recorded responses in `data/fixtures/osrm-cache/` | [FOSSGIS OSRM](https://routing.openstreetmap.de) public service, fair use; route data ODbL | Routing: FOSSGIS OSRM, routing.openstreetmap.de; map data © OpenStreetMap contributors |
| Warsaw public transport timetable (GTFS, 18 October 2026) | `frontend/public/transit-cache.json`, `frontend/public/transit-examples.json` | Published by ZTM Warsaw; GTFS conversion by Mikołaj Kuranowski | Zarząd Transportu Miejskiego w Warszawie (https://ztm.waw.pl); GTFS by Mikołaj Kuranowski (https://mkuran.pl/gtfs/) |
| Warsaw open data: events, air quality stations, AEDs, public toilets (samples) | `data/fixtures/warsaw-open-data-sample.json`, `/api/layers` | [CC BY](https://creativecommons.org/licenses/by/4.0/) | Urząd m.st. Warszawy, https://dane.um.warszawa.pl/ |
| Wikipedia summaries of culture buildings | `frontend/public/corridor-cache.json` (`sen`, `spl`) | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/) | Wikipedia contributors; each summary links its article |
| Wikidata links between OSM and Wikipedia | Build time only (`scripts/build_corridor_cache.py`) | [CC0](https://creativecommons.org/publicdomain/zero/1.0/) | Wikidata |
| Fonts: Barlow Condensed, Titillium Web, Biryani | `frontend/public/fonts/` | [SIL Open Font License 1.1](frontend/public/fonts/OFL.txt) | The Barlow Project Authors; Accademia di Belle Arti di Urbino; Ek Type |
| Language model (optional) | `backend/app/adapters/llm.py`, through OpenRouter | The provider's terms; only the typed request and route facts are sent | — |

Offers, tickets, two events, the six outings' place lists and the example reports are invented for the demo
and say so in the app. No real business is named in an invented offer.
