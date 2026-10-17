# Handover

- Current issue: #27 DATA-08 Display source modes and dates (unblocked: contract PR #32 merged)
- Branch / PR: none yet for DATA-08; start it now. #11 FE-03 is done (PR #31 merged)
- Last verified result: SETUP-01 (#6) local checks pass on `main` at `1cc0a44`: ruff, pytest (2 passed), frontend check and build, `/api/health`, `/api/routes` through the Vite proxy, and 422 for an empty query. The result is posted on #6
- Blocker: None. Per-place provenance (`source_id`, `sources[]`) is on main with contract 1.0
- Next action: switch `components/places/types.ts` to `src/api/contract.ts` and add `SourceLabel` in `components/provenance/`
  - modes: real / historical / proxy / simulated, each with attribution and date
  - real OSM places (`data/fixtures/osm-places-sample.json`, #33) must show "© OpenStreetMap contributors" with the copyright link
- Watching: Ola's PR #36 (FE-02) is on main and mounts `PlaceCardList`; check the cards there. Update the comments in `components/places/types.ts` and `provenance/DataModeBadge.tsx` that still mention the deleted `route.schema.json`
- Open items: Alban to review my #6 result; Tailscale demo check waits for Delta's invitation and demo URL
- Updated at (include timezone): 2026-10-17 16:08 +02:00 (follow-ups added by Delta)

Keep this short. GitHub issues own task status. Update on your own branch; resolve any handover conflict explicitly.
