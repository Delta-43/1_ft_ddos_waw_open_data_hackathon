# Handover

- Current issue: #27 DATA-08 Display source modes and dates (waiting for contract PR #32)
- Branch / PR: none yet for DATA-08; it starts when #32 merges. #11 FE-03 is done (PR #31 merged)
- Last verified result: SETUP-01 (#6) local checks pass on `main` at `1cc0a44`: ruff, pytest (2 passed), frontend check and build, `/api/health`, `/api/routes` through the Vite proxy, and 422 for an empty query. The result is posted on #6
- Blocker: DATA-08 needs per-place provenance (`source_id` and `sources[]`) from PR #32. Ola approved it; Delta still has to resolve 2 docs merge conflicts before it can merge
- Next action: once #32 merges, switch `components/places/types.ts` to `src/api/contract.ts` and add `SourceLabel` in `components/provenance/`
  - modes: real / historical / proxy / simulated, each with attribution and date
  - real OSM places (`data/fixtures/osm-places-sample.json`, #33) must show "© OpenStreetMap contributors" with the copyright link
- Watching: Ola's PR #36 (FE-02) mounts my `PlaceCardList`; check the cards there once it's on main
- Open items: Alban to review my #6 result; Tailscale demo check waits for Delta's invitation and demo URL
- Updated at (include timezone): 2026-10-17 14:39 +0200 (Europe/Warsaw)

Keep this short. GitHub issues own task status. Update on your own branch; resolve any handover conflict explicitly.
