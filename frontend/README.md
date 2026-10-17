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
             controls.ts (reset view), MapView.tsx (React wrapper)
  markers/   types.ts (Pin), pins.ts (addPins/clearPins + popups), icons.ts (hexagon icons),
             samplePins.ts (PLACEHOLDER pins)
  data/      types.ts (PinProvider), warsawOpenData.ts (empty stub), index.ts (registry/loadPins)
  api/       routes.ts (typed POST /api/routes client for the preferences form)
```

## Change the map style

- **Colours:** edit `palette` in `src/map/style.ts`. Every map colour is defined there, and the layers only reference the palette.
- **Layers:** `buildStyle()` in the same file is an ordinary MapLibre style object using the [OpenMapTiles schema](https://openmaptiles.org/schema/): `building`, `water`, `park`, `transportation`, and so on. Add, remove or reorder layers there.
- **Buildings:** height is `render_height` from the tiles, falling back to `FALLBACK_HEIGHT` (12 m). A thin lighter slab on top of each building (`building-roof`) gives the rim highlight.
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
