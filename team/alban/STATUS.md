# Handover

- Current issue: FE-01 (#10)
- Branch / PR: `alban/10-city-data-pins`; PR open for review
- Last verified result: check + build + backend ruff/pytest pass; 107 pins from /api/places and /api/layers (75 OSM places incl. DATA-05 historic sites + 4 city layers × 8 samples) city-wide with data-mode badges and source attribution; no console errors
- Blocker: None. API-01 contract 1.0 is on main (#32, merged on Ola's approval); please review it after the fact and raise any change as a new contract PR
- Next action: add the route layers and selected-route highlight for FE-01; types are in `frontend/src/api/contract.ts`. FE-02 is merged (#36); give Ola her next task. For DATA-07 (#26), Sonia found Warsaw WMS greenery layers (`docs/DATA.md`, DATA-02 section)
- Updated at (include timezone): 2026-10-17 17:52 +02:00

Keep this short. GitHub issues own task status. Update on your own branch; resolve any handover conflict explicitly.
