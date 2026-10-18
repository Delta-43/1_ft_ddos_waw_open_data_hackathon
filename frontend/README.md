# Find YOUR way: frontend

React 19, TypeScript and Vite, with MapLibre GL JS 6 on OpenFreeMap vector tiles. Plain CSS and self-hosted
fonts; no UI framework. Run it with `pnpm dev` (see [docs/DEVELOPMENT.md](../docs/DEVELOPMENT.md)) or in the
`web` container (see the [README](../README.md#run-it-with-docker)).

## The experience

1. **Home:** a still, dark map in a spotlight that leans towards the mouse, and a glowing orb asking
   "Where're we feeling today?".
2. **Prompt:** the orb opens a bubble; the request goes to `POST /api/tracks/run`.
3. **Trip:** the panel docks right with the route (from, stops, to), moods, Nearby toggles, "Why this way"
   and sources. The route draws itself while 3D buildings, parks and trees rise along it.
4. **Close:** the route stays on the home view; tapping the orb with an empty prompt resumes it.

## Source map

```
src/
  App.tsx                    composition: spotlight, parallax, trip state, amenities
  useOuting.ts               request state: prompt → track, mood → track or car-free example
  api/                       contract types, /api clients, car-free examples (transitExamples.ts), ?mock
  components/shell/          TitleBar, Agent (orb, prompt, trip panel, legs), Orb, Reports, moods, shell.css
  components/places/         PlaceCard, PlacePopup (stop cards on the map)
  components/provenance/     SourceLabel, DataModeBadge, SourcesDrawer, MapCredits
  i18n/                      EN/PL dictionary, language store, useT()
  data/cityNotes.ts          message flags (one real event, invented offers) and example reports
  map/
    style.ts                 dark map style (amber streets, dark blocks)
    corridor.ts              3D corridor from corridor-cache.json, reveal wave, culture cards on hover
    routes.ts                route lines, drawing animation, stop circles, fit and hold on the route
    routeLight.ts            the light band that follows the route
    transit.ts               stops near the route and scheduled vehicles (transit-cache.json)
    amenities.ts             toilets and defibrillators near the route
    flags.ts                 message flags
    parallax.ts              home-view camera lean
public/
  corridor-cache.json        OSM buildings, parks, trees, amenities, shops, culture facts, Wikipedia summaries
  transit-cache.json         stops and trips near the demo routes, 18 October 2026
  transit-examples.json      car-free example itineraries
  fonts/                     Barlow Condensed, Titillium Web, Biryani (OFL)
```

The data files are built by the scripts in `scripts/` (see [docs/DATA.md](../docs/DATA.md)).

## Conventions

- Coordinates are `[longitude, latitude]`; metres and seconds.
- Every number keeps a visible source label; estimates are called estimates; invented content says so.
- Hover styling only on hover-capable pointers; pressed controls scale to 0.96; motion honours
  `prefers-reduced-motion`.
- Map credits stay visible at all times (bottom left; under the title bar on phones).
- No backdrop-filter: it re-blurs on every map frame.
- `pnpm run check` and `pnpm run build` must pass before a pull request.
