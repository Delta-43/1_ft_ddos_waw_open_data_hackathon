# Handover

- Current issue: none open for me except team-wide #6. #88 merged; route focus waits for Delta's reply on #86
- Branch / PR: `aryna/revert-moon-restyle` (#89): reverts #82 (Moon) and #74 (history overlay) back to the #77 dark frontend, and now also carries #88's fixes in the dark style: one Sources button (nav only, icon-only on phones), the drawer opens under the nav, and no footer bar, only the floating credit line with a dark text halo. Needs Delta's and Alban's agreement before merge
- Last verified result: `npm run build` passes (tsc + vite). Headless Chrome on desktop 1440×900 and mobile 390×844: one visible Sources button, the footer has a transparent background and no border, the drawer opens and closes, no horizontal scroll, no console errors
- Blocker: none. Touches App.tsx and layout.css (Alban's area), so Alban reviews
- Next action: get this merged; Delta-style route focus waits for Delta's word on #86; pitch prep from 06:00 (screenshots, second-device check, rehearsal)
- Open items: Alban to review my #6 result; Moon design questions are on hold until Aryna raises them
- Updated at (include timezone): 2026-10-17 23:45 +0200 (Europe/Warsaw)

Keep this short. GitHub issues own task status. Update on your own branch; resolve any handover conflict explicitly.
