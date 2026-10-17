# Handover

- Current issue: FE-01 (#10)
- Branch / PR: `alban/10-map-rendering` (rendering and style follow-up to merged PR #4); PR open for review
- Last verified result: check + build pass; fadeDuration 0 cuts post-move redraws 6.8 → 1.3 frames per stop; orbit frame time and scroll long tasks unchanged; LOD and fog/rim removal measured, no gain, not applied
- Blocker: route contract (API-01) not agreed with Delta
- Next action: agree API-01 with Delta (two routes, metrics, per-input data labels), then add the route layers and selected-route highlight for FE-01; give Ola the fixture and FE-02 (form uses `src/api/routes.ts`)
- Updated at (include timezone): 2026-10-17 15:54 +02:00

Keep this short. GitHub issues own task status. Update on your own branch; resolve any handover conflict explicitly.
