# Handover

- Current issue: FE-01 (#10)
- Branch / PR: `alban/10-map-rendering` (rendering and style follow-up to merged PR #4); PR open for review
- Last verified result: check + build pass; fadeDuration 0 cuts post-move redraws 6.8 → 1.3 frames per stop; orbit frame time and scroll long tasks unchanged; LOD and fog/rim removal measured, no gain, not applied
- Blocker: None. API-01 contract 1.0 is on main (#32, merged on Ola's approval); please review it after the fact and raise any change as a new contract PR
- Next action: add the route layers and selected-route highlight for FE-01; types are in `frontend/src/api/contract.ts`. FE-02 is merged (#36); give Ola her next task. For DATA-07 (#26), Sonia found Warsaw WMS greenery layers (`docs/DATA.md`, DATA-02 section)
- Updated at (include timezone): 2026-10-17 16:08 +02:00 (follow-ups added by Delta)

Keep this short. GitHub issues own task status. Update on your own branch; resolve any handover conflict explicitly.
