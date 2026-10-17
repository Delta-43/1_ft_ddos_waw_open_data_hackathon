# Handover

- Current issue: #11 FE-03 Place cards (next: #27 DATA-08)
- Branch / PR: `aryna/11-place-cards`; PR linked from #11, review requested from @kaveOO
- Last verified result: `pnpm run check` and `pnpm run build` pass; the components are not yet imported by the app, so the build doesn't cover them; a scratch server-side render showed mock/cached/live badges and the empty state
- Blocker: shared fixture `data/fixtures/route-response.json` has `places: []`, so the demo shows no cards (fixture is API-01: Delta + Alban). DATA-08 needs per-place source fields (kind, source, date, licence) agreed by Delta + Alban
- Next action: ask Delta/Alban to add 2–3 places to the fixture and to agree per-place provenance fields; then start DATA-08 `SourceLabel` in `components/provenance/`
- Agreed component folders: places/ + provenance/ (Aryna); preferences/ + status/ (Ola); confirm with Ola
- Updated at (include timezone): 2026-10-17 13:11 +0200 (Europe/Warsaw)

Keep this short. GitHub issues own task status. Update on your own branch; resolve any handover conflict explicitly.
