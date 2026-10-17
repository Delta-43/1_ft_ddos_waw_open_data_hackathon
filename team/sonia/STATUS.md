# Handover

- Current issue: [#29 DATA-10: Test provider failures and demo fallback](https://github.com/Delta-43/1_ft_ddos_waw_open_data_hackathon/issues/29) (Sonia + Ola) — backend slice only, since its full scope depends on INT-01 (#14), which is still blocked on FE-01 (#10). PR #55 (cleanup) and PR #54 (DATA-03) both still open, awaiting review.
- Branch / PR: `sonia/data-10-provider-failure-tests` → [PR #57](https://github.com/Delta-43/1_ft_ddos_waw_open_data_hackathon/pull/57), `Refs #29` (partial — frontend/integration half still needs INT-01), review requested from `@Delta-43`.
- Last verified result: Added `backend/tests/test_resilience.py`. Confirmed OSRM-outage fallback is already solid (BE-01's own tests + `conftest.py`'s autouse offline-routing fixture). Found and tested local-cache resilience for `/api/places`/`/api/layers`: missing `city.db` rebuilds fine, missing full open-data cache falls back to the committed sample with honest labelling — both pass. **Found a real gap**: a corrupted (but newer) `city.db` crashes with an unhandled `sqlite3.DatabaseError` → 500, not a graceful fallback. Captured as `xfail(strict=True)` (doesn't fail CI) and filed as [issue #56](https://github.com/Delta-43/1_ft_ddos_waw_open_data_hackathon/issues/56) for Delta, since `db.py` is outside this issue's `backend/tests/`+docs file boundary. `ruff check backend` and `pytest backend/tests` pass (50 passed, 1 xfailed).
- Blocker: None on my slice. QA-01 (#17) and the rest of DATA-10 remain blocked on INT-01/FE-01.
- Next action: Wait for Delta's review. Keep an eye on FE-01 (#10) — once it and INT-01 land, QA-01 and the rest of DATA-10 (actually running the demo, screenshots/recording) become possible.
- Updated at (include timezone): 2026-10-17 17:40 Europe/Warsaw

Keep this short. GitHub issues own task status. Update on your own branch; resolve any handover conflict explicitly.
