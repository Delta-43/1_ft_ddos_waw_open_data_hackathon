# Handover

- Current issue: none assigned yet. BE-02 (#13) done via [PR #43](https://github.com/Delta-43/1_ft_ddos_waw_open_data_hackathon/pull/43) (approved and merged). DATA-01 (#9), DATA-04 (#21) and my half of DATA-02 (#8, PR #38) merged; Delta still owns the routing-provider half of #8.
- Branch / PR: none open
- Last verified result: `GET /api/places` serves the real DATA-01 OSM sample (26 places, `mode: cached`) via `backend/app/data/catalogue.py`; `ruff check backend` and `pytest backend/tests` pass on main (33 tests)
- Blocker: None
- Review follow-ups from Delta (PRs #33 and #43): replace the personal email in `osm_places.py` `USER_AGENT` with the repository URL; keep `pyproject.toml` dependencies in sync with `backend/requirements.txt` (CI installs from the latter). Use `Refs #N`, not `Closes #N`, for a partial fix
- Next action: ask Delta for the next issue. Candidates: QA-01 (#17, demo checks) once BE-01/FE-01 land, or widening `/api/places` with Warsaw open-data amenities if Delta and Alban agree a wider category enum
- Updated at (include timezone): 2026-10-17 16:25 +02:00 (follow-ups added by Delta)

Keep this short. GitHub issues own task status. Update on your own branch; resolve any handover conflict explicitly.
