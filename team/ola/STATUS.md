# Handover

- Current issue: #99 (agent panel). Step 1, route switch, is in progress. #45 is done (PR #96 merged)
- Branch / PR: `ola/99-route-switch`, PR open for Alban (route switch step only)
- Last verified result: `pnpm run check` and `pnpm run build` pass (Node 22). Clicked through by Ola in the browser at `/?mock`; not yet reviewed by Alban
- Mocked behaviour: `?mock` in the URL returns three labelled MOCK routes (`frontend/src/api/mockRoutes.ts`): simulated scores, straight-line geometry, one shared start point (Rondo de Gaulle'a)
- Requirement for the backend (raise with Delta, not yet agreed): the start point is fixed from the user's prompt (`preferences.start`) and is the same for every candidate route. If the user also gives an end point (`destination_place_id`), every candidate starts and ends at those two points; only the way between them differs
- Blocker: none. The route letters on the map are in `frontend/src/map/routes.ts` (Alban's area), so flag them to Alban in the PR
- Next action: finish the route switch, open the PR for Alban, then do the AI/user preference chips, loading/error states and the draft itinerary (#99). Still open from #41's review: map the preference switches onto `preferences`; remove the overridden `width` and unused `.prompt-details` rules in `preferences.css`
- Updated at (include timezone): 2026-10-18 02:15 +02:00

Keep this short. GitHub issues own task status. Update on your own branch; resolve any handover conflict explicitly.
