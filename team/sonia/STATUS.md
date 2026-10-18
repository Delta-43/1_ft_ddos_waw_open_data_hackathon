# Handover

- Current issue: #110 (fixed start point, shared by every candidate route). Implemented directly on the user's instruction, without waiting for Delta's formal sign-off round the issue originally asked for - the rule itself was uncontroversial (see docs/DECISIONS.md, 2026-10-18 02:00).
- Branch / PR: `sonia/110-fixed-start-and-destination`, PR open against `main`.
- Last verified result: rule 1 (shared start across museum-outing candidates) was already true in the existing code - added a test proving it. Rule 2 (shared start+destination for an explicit itinerary, #85) is new: `_itinerary_candidates()` now returns up to 3 candidates between the same two fixed points, varying only by an optional park detour, same pattern as the museum-outing candidates' own variety. 143 backend tests pass (6 new/changed for #110), `ruff check backend` clean, frontend `tsc --noEmit` clean (no frontend files touched - response shape is unchanged, `routes` already allowed 1-3 entries).
- Blocker: none for this issue. #29 (DATA-10) and #17 (QA-01), also assigned to me, are still blocked on #14 (INT-01).
- Next action: pick up #29/#17 once #14 unblocks.
- Updated at (include timezone): 2026-10-18 02:10 Europe/Warsaw

Keep this short. GitHub issues own task status. Update on your own branch; resolve any handover conflict explicitly.
