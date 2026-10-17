# Handover

- Current issue: none open for me except team-wide #6. #88 merged. Route focus in Delta's style is my new PR; it conflicts with #91 D4 (Delta owns the map and chose footprint fetching), so Delta decides
- Branch / PR: `aryna/route-focus-delta-style`: when a route is selected, only buildings within 210 m stay 3D, tinted in the route colour; the rest sink flat and fade under a pale veil; dashed route in its colour; numbered stops on stems (after `mockups/warsaw-2076`)
- Last verified result: `npm run check` and `npm run build` pass. Headless Chrome 1440×900 and 390×844: switching routes moves the corridor (234/194/228 buildings) and the tint, no console errors, Sources and credits from #88 intact
- Blocker: #91 D4 rejects the feature-state approach this uses; needs Delta's call. Touches `frontend/src/map/` (Delta's area for the redesign), so Delta reviews
- Next action: Delta's decision on this PR; #89 was reopened at 23:36 and needs a clear keep/close; pitch prep from 06:00
- Open items: Alban to review my #6 result; Moon design questions are on hold until Aryna raises them
- Updated at (include timezone): 2026-10-18 00:10 +0200 (Europe/Warsaw)

Keep this short. GitHub issues own task status. Update on your own branch; resolve any handover conflict explicitly.
