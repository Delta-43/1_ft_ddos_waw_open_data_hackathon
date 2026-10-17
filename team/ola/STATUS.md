# Handover

- Current issue: #45 (keep map attribution and zoom visible with the expanded assistant panel, with Alban). FE-02 (#3) and its follow-up are done (PRs #36 and #41 merged)
- Branch / PR: none open
- Last verified result: pnpm check and pnpm build pass (Node 22, pnpm 11.25.0); not yet clicked through in a browser by a reviewer
- Blocker: None. Preference summary and chat reply are MOCKS (components/preferences/). The agreed request shape is now `RouteRequest.preferences` in contract 1.0 (`frontend/src/api/contract.ts`, #32), so the switches can be sent to `/api/routes`
- Next action: fix #45; then map the preference switches onto `preferences` (interests, travel_mode, max_duration_s, priorities); remove the overridden `width` and unused `.prompt-details` rules in `preferences.css` (review of #41)
- Updated at (include timezone): 2026-10-17 16:20 +02:00 (follow-ups added by Delta)

Keep this short. GitHub issues own task status. Update on your own branch; resolve any handover conflict explicitly.
