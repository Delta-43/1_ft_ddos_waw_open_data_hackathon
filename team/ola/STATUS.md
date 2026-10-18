# Handover

- Current issue: #99 (agent panel). Route switch merged in #109; follow-up PR restyles the map lines and adds the "Choose" pill
- Branch / PR: `ola/99-route-switch-2`, PR open for Alban
- Last verified result: `pnpm run check` and `pnpm run build` pass (Node 22). Clicked through by Ola in the browser at `/?mock` on desktop; phone layout not checked
- Mocked behaviour: `?mock` in the URL returns three labelled MOCK routes (`frontend/src/api/mockRoutes.ts`): simulated scores, straight-line geometry, one shared start point (Rondo de Gaulle'a)
- Backend rule (fixed start, and fixed destination when given): done by Sonia in #110 / PR #112
- Blocker: none. The map line styles are in `frontend/src/map/routes.ts` (Alban's area); the PR flags them and the removed dash animation from #77
- Next action: AI/user preference chips, loading/error states and the draft itinerary (#99). Still open from #41's review: map the preference switches onto `preferences`; remove the overridden `width` and unused `.prompt-details` rules in `preferences.css`
- Updated at (include timezone): 2026-10-18 02:34 +02:00

Keep this short. GitHub issues own task status. Update on your own branch; resolve any handover conflict explicitly.
