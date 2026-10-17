# OpenStreetMap cache

© OpenStreetMap contributors. This extracted database and its derived geometry caches are made available under the Open Database License 1.0 (ODbL): https://opendatacommons.org/licenses/odbl/1-0/

Attribution and copyright information: https://www.openstreetmap.org/copyright

`source.json` records the fetch time, OSM base timestamp, bounding box in longitude/latitude order, source endpoint, and exact Overpass query. `osm-raw.json.gz` is the complete compressed source response. The fetch succeeded through overpass-api.de after the first mirror returned HTTP 500.

`warsaw-overview.js` contains selected major streets and simplified water/green polygons. `corridor-0.js`, `corridor-1.js`, and `corridor-2.js` contain route-local building footprints, streets, and green polygons. All remain OSM-derived data under ODbL-1.0. The included Python scripts reproduce these transformations without extra packages.

Usable `height` tags are retained as metres. Otherwise `building:levels × 3.2` is a simulated height estimate; absent both, height defaults to a mock 12 metres. Each building retains `height_kind` and its OSM way ID. Rendering exaggerates vertical scale and uses simulated flat roofs and decorative trees. Road widths are presentation choices, not measured widths.

The polygons are a bounded, partial snapshot of mapped features, not a complete survey. Relation outer water rings are assembled and clipped to the bounding box; island rings are retained separately. Building multipolygon relations and detailed roof shapes are outside this lightweight mockup.

No source values supply the demo's opening hours, AI text, route geometry, environmental scores, distances, or durations. Those remain labelled fixture values.
