# Warsaw 2076 frontend: 3D map

A full-screen, bright game-style 3D map of Warsaw built with MapLibre GL JS 6 on free OpenFreeMap vector tiles. It needs no API key, account or backend. React only mounts the map; the map, pin and data modules are plain TypeScript.

## Run

Requires Node.js 22 and pnpm 11.25.0 (see `SETUP.md`).

```bash
cd frontend
pnpm install --frozen-lockfile
pnpm dev
```

Open http://127.0.0.1:5173. Once dependencies are installed, `npm run dev` also works. Don't run `npm install`: the lockfile is pnpm's, and CI installs with `pnpm install --frozen-lockfile`.

| Command | What it does |
| --- | --- |
| `pnpm dev` | Dev server; `/api` is proxied to the backend on port 8000 |
| `pnpm run check` | TypeScript check |
| `pnpm run build` | Type check and production build into `dist/` |

MapLibre 6 requires WebGL2, which every current desktop and mobile browser supports. Tiles are fetched online, so record a fallback video for the pitch.

## Layout

```
src/
  App.tsx       Map plus the bottom banner
  map/          createMap.ts (map + controls), style.ts (bright game style), config.ts (camera, tiles),
                controls.ts (reset view), buildingOutlines.ts (show building parts),
                MapView.tsx (React wrapper)
  markers/      types.ts (Pin), pins.ts (addPins/clearPins + popups), icons.ts (hexagon icons)
  data/         places.ts (/api/places), cityLayers.ts (/api/layers), api.ts (fetch, source labels),
                types.ts (PinProvider), index.ts (registry, loadPins)
  api/          routes.ts (typed POST /api/routes client for the preferences form)
  style.css     Overlay UI: banner, controls, popups
```

## Map style

- **Look:** a bright game map that merges two references. The ground follows the GTA V map: cyan water, soft green parks, light urban ground, white roads with grey casings, dark district outlines and dark labels on white halos. The 3D buildings follow the Assassin's Creed Unity map: pale steel-blue walls and light roofs. Pins and the banner keep the dark hexagon / panel style from that map.
- **Colours:** edit `palette` in `src/map/style.ts`. Every map colour is defined there, and the layers only reference the palette.
- **District outlines:** Warsaw's 18 districts (OSM `admin_level` 9) are drawn as solid dark green lines, and neighbourhoods (`admin_level` 10) as dashed lines from zoom 14.
- **Layers:** `buildStyle()` in the same file is an ordinary MapLibre style object using the [OpenMapTiles schema](https://openmaptiles.org/schema/) (`building`, `water`, `park`, `transportation` and so on). Add, remove or reorder layers there.
- **Light, sky and fog:** the `light` and `sky` blocks of the style. The light sits 55° from vertical with intensity 0.5, so roofs don't catch full light and walls show clear light and shade; lit faces reach 1.0 × their colour, faces turned away 0.5 ×. Keep the light colour near white. MapLibre adds (1 − light colour) as ambient light, so a saturated light tints shadowed walls with its complementary colour.
- **Camera and limits:** start view, Warsaw bounds, zoom range and the 75° pitch cap are in `src/map/config.ts`.
- **Overlay UI:** the banner, controls and popups are styled in `src/style.css`.

## Buildings

- **Height:** `render_height` from the tiles, falling back to `FALLBACK_HEIGHT` (12 m).
- **Look:** untextured, flat colours only: pale steel-blue walls, slightly lighter as height increases (`buildingLow` → `buildingHigh`). The free tiles have no facade imagery. From zoom 16 up, a light roof slab (`building-roof`) and blue footprint lines add the rooftop and rim highlight. Keep roofs off-white (`#d6e1ec`): a near-white slab glares against the bright ground.
- **Detailed shapes:** in OpenStreetMap, landmarks such as the Palace of Culture are mapped as several `building:part` shapes (podium, tower tiers, spire) plus one outline carrying the total height. OpenMapTiles should flag that outline with `hide_3d`, but it misses many, including the Palace, Varso, Warsaw Spire and Złota 44. Left alone, the outline renders as a solid box over the parts and z-fights with them. `src/map/buildingOutlines.ts` finds these outlines in the loaded tiles and collapses them to zero height using feature-state. An outline is hidden when:
  - smaller parts inside it reach its height;
  - at least one part starts above the ground (the `building:part` signature);
  - the parts' footprints add up to at least 30% of its own.
- **Known limitation:** a few OSM relations bundle many separate blocks into one feature with a single height. They can't be hidden piecemeal, so one block may still z-fight with its parts.

## Performance rules

These keep panning, zooming and scrolling smooth. They were measured in headless Chrome (software rendering, so only the ratios matter):

| Rule | Why |
| --- | --- |
| Keep `fill-extrusion-opacity` at 1 | Below 1, MapLibre draws every building twice (a depth pass and a colour pass): +26% frame time. |
| Extra per-building layers (roof slab, footprint lines) start at `DETAIL_MINZOOM` (16) | Each is a full extra pass over every building: +18% and +10% frame time at zoom 15 |
| Device pixel ratio capped at 2 (`createMap`) | Saves shading 2.25× the pixels on 3× phone screens |
| No label fade (`fadeDuration: 0` in `createMap`) | Fading labels keeps redrawing the whole 3D scene after the camera stops: 6.8 → 1.3 frames per stop. Labels appear instantly |
| Outline scan runs on idle, in 6 ms slices, and stops when the camera moves | Main-thread long tasks during scroll-pause-scroll went from 6 to 0–1. The first scan on load runs in one go, before anyone interacts, so landmarks never open as solid boxes |
| No CSS `backdrop-filter` over the map | Blurring behind the banner or popups is recomputed on every map frame and causes jank on laptops and phones |

Together, the opacity and detail-zoom rules took mean frame time during a camera orbit from about 130 ms to 65–75 ms in that test.

## Pins and data sources

The map shows pins from the backend, all over Warsaw:

| Pins | Endpoint | Source |
| --- | --- | --- |
| Museums, landmarks, parks, other places | `GET /api/places` | OpenStreetMap (ODbL), fetched at event time |
| Air quality stations, defibrillators (AED), public toilets, cultural events | `GET /api/layers/{air_quality,aed,toilets,events}` (GeoJSON) | Warsaw open data, dane.um.warszawa.pl (CC BY) |

- `src/data/places.ts` and `src/data/cityLayers.ts` request the whole Warsaw bounding box at each endpoint's maximum limit (100 places, 500 per layer), through the relative `/api` path that Vite proxies to the backend. More data in the backend's store (e.g. the full Warsaw cache in `data/local`) appears without frontend changes.
- Every popup shows the data mode as a badge ("Real data, fetched at event time", "Cached open data · sample subset"; "sample subset" when the source's `method` says so), plus the source name and retrieval time. The map's attribution line credits each source; the API's credit text is escaped before MapLibre renders it as HTML.
- If the backend is unreachable, the map still works without pins; each failed provider is logged.
- Today the backend holds the committed samples: 26 OSM places around Łazienki/Ujazdów and 8 features per city layer.

`addPins(map, pins)` puts all pins in one GeoJSON source drawn by a single GPU symbol layer, with no DOM markers, so thousands of pins stay smooth. Calling it again with an existing `id` replaces that pin; `clearPins(map)` removes them all. Pins shrink when zoomed out. For very dense datasets, enable `cluster: true` on the source in `src/markers/pins.ts`.

To add a data source:

1. Implement `PinProvider` (in `src/data/types.ts`) in a new file under `src/data/`. Its `fetchPins()` returns `Pin[]` (see `src/markers/types.ts`), each with its source's `badge` and `attribution`. `src/data/api.ts` has the shared fetch and source-label helpers.
2. Register the provider in the `providers` list in `src/data/index.ts`. `MapView` loads every provider at start-up and passes the pins to `addPins()`. A provider that fails is logged and skipped.
3. For a new pin type, add a category and its hexagon glyph in `src/markers/types.ts` and `src/markers/icons.ts`.

City data that needs a key must come through a relative `/api/...` endpoint served by the backend, never directly from the browser.

## External services

The map only contacts OpenFreeMap (vector tiles and fonts). Google Photorealistic 3D Tiles were tried and removed, and no Google API is called; see `docs/DECISIONS.md`. The browser code reads no `VITE_*` variables (only `vite.config.ts` reads `DEV_BIND_HOST` and `API_PROXY_TARGET`, server-side), so no keys are needed. Vite still serves any `VITE_*` value to the browser in dev mode, so don't keep keys there.

## Debugging

In development, the map instance is exposed as `window.warsawMap` for the browser console.

## Attribution

The credits "OpenFreeMap © OpenMapTiles Data from OpenStreetMap" come from the tile source, and the map always shows them, uncollapsed. Keep them visible: OSM data is under the ODbL.
