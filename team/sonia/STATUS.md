# Handover

- Current issue: none open and unblocked for me right now. SIM-01 (#24) and SIM-02 (#25) fixtures are done, PRs open. #85 (explicit destination/via stops) and #84 (catalogue search) are fully merged to `main`, across my PRs #93/#95/#102/#103 and #87.
- Branch / PR: open from me: [PR #105](https://github.com/Delta-43/1_ft_ddos_waw_open_data_hackathon/pull/105) (SIM-01) and [PR #106](https://github.com/Delta-43/1_ft_ddos_waw_open_data_hackathon/pull/106) (SIM-02), both ready for review, both fixture-only (`data/fixtures/`), not wired into any API — no contract field exists yet for noise/traffic/incidents/roadworks and that needs Delta+Alban's sign-off first.
- Last verified result: both new fixtures are valid JSON; `ruff check backend` and `pytest backend/tests` pass unaffected (fixtures aren't imported by any code). The #85 stack (merged) is covered by its own tests: 133 backend tests passed at the time of the last PR in that stack, `tsc --noEmit` clean.
- Blocker: none for my own open work. #29 (DATA-10) and #17 (QA-01), also assigned to me, are blocked on #14 (INT-01), still open.
- Next action: pick up #29/#17 once #14 unblocks, or #76 (historical overlay) just needs Delta to confirm and close — attribution, reuse terms and `.claude/launch.json` removal are all done on `main` (PR #74, #90).
- Updated at (include timezone): 2026-10-18 01:45 Europe/Warsaw

Keep this short. GitHub issues own task status. Update on your own branch; resolve any handover conflict explicitly.
