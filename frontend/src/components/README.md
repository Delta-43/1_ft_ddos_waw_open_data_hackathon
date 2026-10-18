# Module ownership

The shell (`shell/`) is the app's layout since the "Find YOUR way" rebuild: title bar, the guide (orb, prompt, trip panel), reports. Map modules live in `src/map/`.

Agreed folders, so names do not collide:

- `shell/`: `TitleBar`, `Agent` (orb, prompt and trip panel), `Orb`, `Reports`, moods.
- `places/` (Aryna): `PlaceCard`, `PlacePopup`.
- `provenance/` (Aryna): `DataModeBadge`, `SourceLabel`, `SourcesStrip`, `SourcesDrawer` (DATA-08). Use `SourceLabel` with `sourceFor(sources, id)` from `src/api/contract.ts` to label any metric or place.
