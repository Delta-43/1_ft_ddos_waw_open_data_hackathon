# Module ownership

Ola owns forms and UI states. Aryna owns place cards and data-source labels. Alban reviews both.

Agreed folders, so names do not collide:

- `places/` (Aryna): `PlaceCard`, `PlacePopup` (the card next to a stop, moved clear of panels).
- `provenance/` (Aryna): `DataModeBadge`, `SourceLabel`, `SourcesStrip`, `SourcesDrawer` (DATA-08). Use `SourceLabel` with `sourceFor(sources, id)` from `src/api/contract.ts` to label any metric or place.
- `preferences/` and `status/` (Ola): the preferences form, plus loading, error and empty states.
