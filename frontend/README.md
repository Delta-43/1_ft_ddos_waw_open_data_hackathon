# Warsaw 2076 frontend: 3D map

A full-screen, dark 3D map of Warsaw built with MapLibre GL JS 6 on free OpenFreeMap vector tiles. It needs no API key, account or backend. React only mounts the map; the map, pin and data modules are plain TypeScript.

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
  map/       createMap.ts (map + controls), style.ts (dark style), config.ts (camera, tiles),
             controls.ts (reset view), buildingOutlines.ts (show building parts), MapView.tsx (React wrapper)
  markers/   types.ts (Pin), pins.ts (addPins/clearPins + popups), icons.ts (hexagon icons),
             samplePins.ts (PLACEHOLDER pins)
  data/      types.ts (PinProvider), warsawOpenData.ts (empty stub), index.ts (registry/loadPins)
  api/       routes.ts (typed POST /api/routes client for the preferences form)
```

## Change the map style

- **Colours:** edit `palette` in `src/map/style.ts`. Every map colour is defined there, and the layers only reference the palette.
- **Layers:** `buildStyle()` in the same file is an ordinary MapLibre style object using the [OpenMapTiles schema](https://openmaptiles.org/schema/): `building`, `water`, `park`, `transportation`, and so on. Add, remove or reorder layers there.
- **Buildings:** height is `render_height` from the tiles, falling back to `FALLBACK_HEIGHT` (12 m). From zoom 16 up, a thin lighter roof slab (`building-roof`) and faint footprint lines add the rim highlight.
- **Untextured buildings:** every building uses the dark palette only (`buildingLow` → `buildingHigh` by height). The free tiles carry no facade imagery; a Google Photorealistic 3D Tiles option was tried and removed (see `docs/DECISIONS.md`).
- **Detailed buildings:** in OpenStreetMap, landmarks such as the Palace of Culture are mapped as several `building:part` shapes (podium, tower tiers, spire) plus one outline carrying the total height. OpenMapTiles is meant to flag that outline with `hide_3d`, but it misses many, including the Palace, Varso, Warsaw Spire and Złota 44. Left alone, the outline renders as a solid box over the parts and z-fights with them. `src/map/buildingOutlines.ts` detects these outlines in the loaded tiles and collapses them, using feature-state, to zero height. An outline is hidden when:
  - smaller parts inside it reach its height;
  - at least one part starts above the ground (the `building:part` signature);
  - the parts' footprints add up to at least 30% of its own.
- **Known limitation:** a few OSM relations bundle many separate blocks into one feature with a single height. They can't be hidden piecemeal, so one block may still z-fight with its parts.

### Performance rules

Measured in headless Chrome during a 4-second camera orbit at zoom 15; the full set takes mean frame time from about 130 ms to about 65–75 ms.

- Keep `fill-extrusion-opacity` at 1. Below 1, MapLibre draws every building twice (a depth pass and a colour pass): +26% frame time.
- Extra per-building layers, such as the roof slab and footprint lines, cost a full pass each (+18% and +10%), so they start at `DETAIL_MINZOOM` (16).
- `createMap` caps the device pixel ratio at 2. On 3× phone screens this avoids shading 2.25× the pixels.
- The outline scan only runs once the map is idle after new tiles arrive, skips buildings already handled, and works in 6 ms slices that stop as soon as the camera moves. Main-thread long tasks during scroll-pause-scroll went from 6 to 0–1. The first scan on load runs in one go, before anyone interacts, so landmarks never open as solid boxes.
- No CSS `backdrop-filter` over the map: blurring what sits behind the banner or popups is recomputed on every map frame and causes jank on laptops and phones.
- **Light, sky and fog:** the `light` and `sky` blocks of the style. Keep the light colour near white; a saturated light colour tints shadowed walls with its complement.
- **Camera and limits:** start view, Warsaw bounds, zoom range and the 75° pitch cap are in `src/map/config.ts`.
- **Overlay UI:** the banner, controls and popups are styled in `src/style.css`.

## Add a data source later

1. Implement `PinProvider` (in `src/data/types.ts`) in a new file under `src/data/`. Its `fetchPins()` returns `Pin[]` (see `src/markers/types.ts`). Put the source, date and licence of each record in `properties`.
2. Register the provider in the `providers` list in `src/data/index.ts`. `MapView` loads every provider at start-up and passes the pins to `addPins()`. A provider that fails is logged and skipped.
3. Show the provider's `attribution` wherever its pins are shown.
4. Remove `samplePins` from `MapView.tsx` once real pins exist.

Warsaw's open-data API needs a key, and keys must stay on the backend. Fetch city data through a relative `/api/...` endpoint served by the backend, never directly from the browser. `src/data/warsawOpenData.ts` is the stub for this.

`addPins(map, pins)` puts all pins in one GeoJSON source drawn by a single GPU symbol layer, with no DOM markers, so thousands of pins stay smooth. Calling it again with an existing `id` replaces that pin. For very dense datasets, enable `cluster: true` on the source in `src/markers/pins.ts`.

## Debugging

In development, the map instance is exposed as `window.warsawMap` for the browser console.

## Attribution

The credits "OpenFreeMap © OpenMapTiles Data from OpenStreetMap" come from the tile source, and the map always shows them, uncollapsed. Keep them visible: OSM data is under the ODbL.
