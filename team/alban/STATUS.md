# Handover

- Current issue: FE-01 (TODO.md); no GitHub issue created yet
- Branch / PR: `alban/fe-01-3d-map`; PR #4 open on GitHub with the first commit only; later commits are local (not pushed)
- Last verified result: `pnpm install --frozen-lockfile`, `pnpm run check` and `pnpm run build` pass (pnpm 11.25.0). Headless Chrome (SwiftShader WebGL2) renders 3D buildings, water, pins, popup, reset view, bounds and the 75° pitch cap, in dev and in the production build. Building-part fix verified: Palace of Culture, Varso, Warsaw Spire and Złota 44 show their OSM parts instead of solid outlines
- Blocker: route contract (API-01) not agreed with Delta; the fixture has one two-point route and no places
- Next action: agree API-01 with Delta (two routes, metrics, per-input data labels), then add the route layers and selected-route highlight for FE-01; give Ola the fixture and FE-02 (form uses `src/api/routes.ts`)
- Updated at (include timezone): 2026-10-17 13:05 +02:00

Keep this short. GitHub issues own task status. Update on your own branch; resolve any handover conflict explicitly.
