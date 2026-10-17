# Handover

- Current issue: #45 done (#96 merged). Route focus in Delta's style (#94) is open for Delta's decision; it conflicts with #91 D4
- Branch / PR: `aryna/route-focus-delta-style` (#94), now merged with main's dark design (#89, #96): only buildings within 210 m of the selected route stay 3D, tinted in its colour; the rest fade flat under a pale veil; dashed route; numbered stops on stems
- Last verified result: after merging main, `pnpm run check` and `pnpm run build` pass; headless Chrome on the dark design at 1440×900 and 390×844, switching routes moves the corridor and tint, no console errors
- Blocker: Delta's decision on #94 vs D4 option A. Touches `frontend/src/map/`, so Delta reviews
- Next action: place cards attached to their stops (#91 section 5), then route comparison and panels, each with the three skills
- Open items: Sources entry for estimated building heights once D4's data source exists; #80 still says "finish Moon" (ask Delta to close or reword it)
- Updated at (include timezone): 2026-10-18 01:00 +0200 (Europe/Warsaw)

Keep this short. GitHub issues own task status. Update on your own branch; resolve any handover conflict explicitly.
