# Handover

- Current issue: FE-01 (TODO.md); no GitHub issue created yet
- Branch / PR: `alban/fe-01-3d-map`; PR #4 open on GitHub with the first commit only; later commits are local (not pushed)
- Last verified result: check + build pass (pnpm 11.25.0). Headless Chrome: OSM building colours render, landmarks show their parts, rendering ~1.8–2× faster in an orbit benchmark (mean frame 128–135 ms → 64–73 ms, SwiftShader); dev and production build smoke tests pass
- Blocker: route contract (API-01) not agreed with Delta; the fixture has one two-point route and no places
- Next action: agree API-01 with Delta (two routes, metrics, per-input data labels), then add the route layers and selected-route highlight for FE-01; give Ola the fixture and FE-02 (form uses `src/api/routes.ts`)
- Updated at (include timezone): 2026-10-17 13:21 +02:00

Keep this short. GitHub issues own task status. Update on your own branch; resolve any handover conflict explicitly.
