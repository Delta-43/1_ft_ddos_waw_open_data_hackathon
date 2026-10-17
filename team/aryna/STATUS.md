# Handover

- Current issue: #27 DATA-08 Display source modes and dates
- Branch / PR: #51 approved, waiting for merge. Follow-up `aryna/ui-polish` (stacked on #51): no overlaps, understood preferences as chips in the top bar (re-run search), assistant is chat-only, Language Explorer palette, map credit in the bottom bar
- Last verified result: check + build pass; ruff + pytest 36 passed. Headless Chrome (SwiftShader) clicked the full flow on desktop 1440×900 and mobile 390×844: intro lands at zoom 15 / pitch 60 with the location-off hint; prompt → Find routes → 2 route cards + 4 place cards + route layer and stops on the map; switching route updates the stops; the Sources drawer opens; no console errors
- Blocker: none. This PR edits files owned by Alban (map, App, layout) and Ola (widget button and results hand-off), at Aryna's explicit request; they need to review
- Next action: after #51 merges, check on main that real routes show Real/Proxy labels and that the "explanation written by AI" note appears when the model interprets; then pitch prep (screenshots of cards and labels, second-device check)
- Open items: Alban to review my #6 result; Tailscale demo check waits for Delta; the bright map (#39) vs the dark design canvas needs a chat with Alban
- Updated at (include timezone): 2026-10-17 17:54 +0200 (Europe/Warsaw)

Keep this short. GitHub issues own task status. Update on your own branch; resolve any handover conflict explicitly.
