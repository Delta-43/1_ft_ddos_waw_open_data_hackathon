# Handover

- Current issue: none formally ticketed — exploratory catalogue entry for a "show historical 1930s-40s Warsaw" idea, raised in discussion. DATA-10 (#29, backend slice, PR #57) merged. PR #54 (DATA-03) still open, no review.
- Branch / PR: `sonia/data-11-historical-layer-catalogue` → opening PR now, no issue to close (pure research/catalogue), review requested from `@Delta-43`.
- Last verified result: Found that `wms.um.warszawa.pl/serwis` (already catalogued for noise/greenery, DATA-02) also has real historical layers: city-boundary outlines 1916-1992 including 1930/1938, a 1939 street network and city plan, 1935/1945 aerial orthophotos, and the heritage register. Tested `GetFeatureInfo` on `HISTORIA_GRANICA_1930` properly (rendered the layer to confirm exact line position, tried every WMS version/format combo, used a control layer to confirm the server does process the requests) — concluded these are render-only (opacity-slider overlay use case), not vector-queryable. Documented in `docs/DATA.md`. No code changes.
- Blocker: None.
- Next action: Wait for Delta's review on PR #54 and this new one. If the team wants the historical overlay built, it'd need a new ticketed issue — this PR is research only. Otherwise, keep checking whether FE-01 (#10)/INT-01 (#14) have moved, which unblocks the rest of QA-01/DATA-10.
- Updated at (include timezone): 2026-10-17 18:10 Europe/Warsaw

Keep this short. GitHub issues own task status. Update on your own branch; resolve any handover conflict explicitly.
