# Handover

- Current issue: none active. Merged today: #7 contract, #12 BE-01 routes (PR #40), #15 AI-01 (PR #44), city-data SQLite store and `/api/layers` (PR #47), isometric mockup (PR #53, #52)
- Branch / PR: no open PRs from Delta. Open elsewhere: #51 (Aryna), #54 (Sonia, DATA-03), #59 (Alban, city pins from `/api/places` + `/api/layers`)
- Last verified result: `ruff check backend` pass; `pytest backend/tests` 56 passed. Integrated server runs on silver-storm, Tailscale address only, port 8000. Live OSRM routes verified; OpenRouter path not tested with a real key
- Blocker: #50 (layer source `mode` must be a SourceMode; Alban's #59 will surface it) and #56 (corrupt `city.db` returns 500). Restart the shared server from `main` to serve the merged code
- Next action: fix #50 and #56 and `/api/health` mode; then MCP-01 (#16), INT-01 (#14) with Alban, DATA-06 write-up (#23), DATA-07 (#26), DATA-09 (#28). Pitch (#18) starts at the 06:00 freeze
- Updated at (include timezone): 2026-10-17 17:52 +02:00

Keep this short. GitHub issues own task status. Update on your own branch; resolve any handover conflict explicitly.
