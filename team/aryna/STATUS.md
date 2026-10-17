# Handover

- Current issue: none open for me except team-wide #6. Delta closed #86 (Moon route experience) unmerged at 22:58, so its Sources-in-nav fix is not on main
- Branch / PR: `aryna/nav-sources-floating-credits`: one Sources button (nav only, icon-only on phones), the Sources drawer opens under the nav, and the footer bar is gone: only the floating credit line over the map ("OpenFreeMap © OpenMapTiles Data from OpenStreetMap · Urząd m.st. Warszawy (CC BY) · We don’t store your requests or location.") with a white text halo
- Last verified result: `npm run build` passes (tsc + vite). Headless Chrome on desktop 1440×900 and mobile 390×844: one visible Sources button, the footer has a transparent background and no border, the drawer opens and closes, no horizontal scroll, no console errors
- Blocker: none. Touches App.tsx and layout.css (Alban's area), so Alban reviews
- Next action: get this merged; Delta-style route focus waits for Delta's word on #86; pitch prep from 06:00 (screenshots, second-device check, rehearsal)
- Open items: Alban to review my #6 result; Moon design questions are on hold until Aryna raises them
- Updated at (include timezone): 2026-10-17 23:30 +0200 (Europe/Warsaw)

Keep this short. GitHub issues own task status. Update on your own branch; resolve any handover conflict explicitly.
