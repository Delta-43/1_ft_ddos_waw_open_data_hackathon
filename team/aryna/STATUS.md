# Handover

- Current issue: #27 DATA-08 Display source modes and dates
- Branch / PR: `aryna/27-source-labels`, PR linked from #27 (review: @kaveOO; @unicorn-alex for the 2-line widget change)
- Last verified result: `pnpm run check` and `pnpm run build` pass; `ruff` + pytest (28 passed). Rendered the cards and strip with the live `/api/routes` response (contract 1.0): 4 stops in visit order with times, "Opening hours: Unknown", per-place "Simulated · Demo place list", strip "3 simulated inputs" plus the drawer
- Blocker: none. Still to do for DATA-08: source labels on route metrics and explanations, which belong in the route comparison cards (Alban, FE-01). `SourceLabel` is ready for them
- Next action: address review; then help Alban mount `SourceLabel` on route metrics; check the labels again when Delta's #40 (real OSM places, proxy scores) merges
- Open items: Alban to review my #6 result; Tailscale demo check waits for Delta; the bright map (#39) vs the dark design canvas needs a chat with Alban
- Updated at (include timezone): 2026-10-17 16:12 +0200 (Europe/Warsaw)

Keep this short. GitHub issues own task status. Update on your own branch; resolve any handover conflict explicitly.
