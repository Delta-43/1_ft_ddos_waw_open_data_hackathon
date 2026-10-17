# Frontend experience: review and handover

17 October 2026. Branch `delta/80-moon-route-experience`; Refs #80, #84, #85.

## Delivered phases

1. Read the #81 design handover, #82 Moon foundation and #83 pitch briefing. Established `PRODUCT.md`, `DESIGN.md` and shared Moon tokens.
2. Rebuilt the planner, conversation/follow-up, preferences, route comparison and place details with the existing REST API and source labels.
3. Applied the paper map, mood highlights, location-bound cards and overview-scale 3D corridor. Preserved street geometry and complete-route camera bounds.
4. Added historical year/opacity controls, fictional promotion examples, local feedback save/export/delete and a simulated AR overlay.
5. Added light/dark appearance, contrast, larger text, reduced motion, mobile map/planner views, keyboard controls, error recovery and explicit demo fallback.
6. Ran visual, interaction, accessibility and motion reviews; corrected the issues below.

## Validation

- `pnpm --dir frontend run check`: passed.
- `pnpm --dir frontend run build`: passed. Existing MapLibre bundle size warning remains (main bundle about 1.35 MB / 382 kB gzip, plus worker).
- `scripts/frontend-experience-check.mjs`: passed with deterministic API fixtures and with a locally seeded backend. Covers route submission, theme, correct mood paint after asynchronous layer creation, place details, feedback save/export/delete, reduced-motion reset, AR close, itinerary gating, mobile overflow, simulated future itinerary contract and service failure. Live mode also requires nonempty 3D corridor geometry.
- Separate axe-core 4.10.3 Chromium checks: zero reported violations for light landing, light results, dark results and mobile high contrast/larger text (WCAG 2 A/AA, 2.1 AA and best-practice rules). This is an automated sample, not a complete accessibility certification.
- Real local backend: three street routes returned; historical 1935 WMS imagery reached loaded state. These online dependencies can still fail during a pitch.
- Visual inspection: desktop light/dark, mobile map/planner, historical overlay and AR concept. Screenshots are in `docs/design-review/moon/`.
- Better UI review: shared elevation/radii, local Lucide icons, explicit transitions, pressed state, immediate theme swap and forced-colour boundaries.
- Impeccable detector: no findings on the new experience, appearance module or tokens. Manual craft review corrected small text, target sizes, contrast labels and map-card clipping.
- Improve Animations read-only audit: fixes cover runtime reduced-motion changes, every camera control, history slider response, listener/timer teardown and stale route-building scans. Removed the surprise geolocation/intro camera takeover.

## Reproduce

Use the normal frontend/backend setup. Seed the local backend once before concurrent requests. Start Vite with `API_PROXY_TARGET` pointing to that backend. The check script uses `FRONTEND_URL` (default `http://127.0.0.1:5181`). It needs the same external `@playwright/test` tooling as the existing design screenshot script; no runtime or lockfile dependency was added. An existing installation can be selected with `PLAYWRIGHT_MODULE=/absolute/path/to/@playwright/test/index.mjs`.

```bash
FRONTEND_URL=http://127.0.0.1:5173 node scripts/frontend-experience-check.mjs
FRONTEND_URL=http://127.0.0.1:5173 node scripts/frontend-experience-check.mjs --live
```

The map checks require online OpenFreeMap tiles, even with mocked route API responses. Review execution used Chromium with SwiftShader, the installed Node/pnpm runtimes, and the existing Python 3.14 local virtualenv; it did not certify the reference Python 3.12 environment or hardware GPU performance.

## Boundaries for reviewers

- #84 requests backend catalogue search; the current selector filters the first 100 catalogue records locally.
- #85 requests explicit destination/ordered stops and capability/response confirmation. The frontend deliberately cannot submit this draft to today's backend, which would otherwise silently ignore it. Mocked contract success is not evidence of backend implementation.
- Conversation is an eight-turn local request/answer history with bounded previous-query context. AI interpretation depends on the backend; rule-based results are labelled. Mood and travel controls are explicit preferences, not inferred mood sensing.
- Feedback never reaches a municipality. Promotions are fictional. AR uses the map as a stand-in, with no camera access or tracking. Historical imagery is the existing attributed city WMS source.
- Base Moon values come from the team's #82 work. Direct Figma community file inspection was blocked; dark/mood extensions are project decisions, not claimed Figma exports. Averta is not bundled; the system fallback stays.
- 3D corridor rendering uses tile footprints and estimated missing heights. It is not a surveyed architectural model; duplicate clipped pieces/OSM outline overlap can remain at detailed zoom.
- Physical-device, Safari/Firefox, screen-reader and hardware frame-time testing remain manual review tasks. Automatic contrast checks do not establish every map label's contrast against variable imagery.
- No shared-server deployment, main push, merge or backend schema change is part of this branch. Ola reviews the UI; Alban should review map changes.
