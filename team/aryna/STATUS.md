# Handover

- Current issue: #45 (attribution and zoom visible with the assistant open), from my part of #91. #89 merged at 23:41: the dark design is on main
- Branch / PR: `aryna/45-attribution-zoom-visible`: on phones the assistant panel leaves the right edge to the map controls; the assistant wrapper lets clicks through; dead `assistant__panel--wide` CSS removed. #94 (route focus, Delta-style) is open for Delta to decide (conflicts with D4)
- Last verified result: `pnpm run check` and `pnpm run build` pass. Headless Chrome 1440×900, 1024×768, 390×844, 360×740 with the assistant open before and after a search: zoom, compass and every credit link are on top and clickable; assistant controls still clickable
- Blocker: none. Ola owns #45 on paper, so Ola and Delta review
- Next action: next #91 item for me (panels, route comparison, place cards with the three skills); Sources entry for estimated building heights once D4's data source exists
- Open items: #94 needs Delta's decision; it was built on Moon, so after #89 it needs a small `places.css` update
- Updated at (include timezone): 2026-10-18 00:45 +0200 (Europe/Warsaw)

Keep this short. GitHub issues own task status. Update on your own branch; resolve any handover conflict explicitly.
