# Handover

- Current issue: [#24 SIM-01: Create environmental and disruption demo fixtures](https://github.com/Delta-43/1_ft_ddos_waw_open_data_hackathon/issues/24) (Sonia + Delta) → [PR #49](https://github.com/Delta-43/1_ft_ddos_waw_open_data_hackathon/pull/49), **approved by Delta, CI green**, rebased onto main now that [DATA-05](https://github.com/Delta-43/1_ft_ddos_waw_open_data_hackathon/issues/22) (#48) has **merged**.
- Branch / PR: `sonia/sim-01-environmental-fixtures` → PR #49, rebased onto main post-#48-merge.
- Last verified result: Split `route-response.json`'s shared `fixture-scores` source into `sim-green-score`/`sim-quiet-score`, each still `mode: "simulated"` but naming the real dataset it could draw from once BE-01's scoring service exists. Documented why traffic/incidents/roadworks have no fixture (no contract field, current routes are illustrative straight lines) as an open question for Delta+Alban rather than inventing one.
- Review follow-ups from Delta (not yet actioned, carried from PRs #33/#43): replace the personal email in `osm_places.py`'s `USER_AGENT` with the repository URL; keep `pyproject.toml` dependencies in sync with `backend/requirements.txt`; use `Refs #N` not `Closes #N` for a partial fix on a joint issue.
- Blocker: None.
- Next action: Confirm #49 merges via auto-merge once CI passes post-rebase. Then start [#20 DATA-03](https://github.com/Delta-43/1_ft_ddos_waw_open_data_hackathon/issues/20) (cache/document event-time source responses — unblocked, mostly a verification pass over existing `docs/DATA.md` entries). Also action Delta's three follow-ups above in a small PR.
- Updated at (include timezone): 2026-10-17 17:00 Europe/Warsaw

Keep this short. GitHub issues own task status. Update on your own branch; resolve any handover conflict explicitly.
