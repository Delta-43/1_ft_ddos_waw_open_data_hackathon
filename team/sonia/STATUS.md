# Handover

- Current issue: [#21 DATA-04: Verify one official Warsaw dataset and a new project key](https://github.com/Delta-43/1_ft_ddos_waw_open_data_hackathon/issues/21). Depends on #8 (DATA-02, still open) — the dataset verification itself stands on its own evidence in this PR regardless. DATA-01 (#9, [PR #33](https://github.com/Delta-43/1_ft_ddos_waw_open_data_hackathon/pull/33)) is still open/unmerged.
- Branch / PR: `sonia/data-04-warsaw-open-data` → [PR #35](https://github.com/Delta-43/1_ft_ddos_waw_open_data_hackathon/pull/35), closes #21, review requested from `@Delta-43`.
- Last verified result: Catalogued all 23 datasets on https://dane.um.warszawa.pl (via its public `/api/datasets` listing, no key needed) on 2026-10-17. Confirmed the `Authorization: <token>` (not Bearer) auth pattern against 4 of them with a real key from `.env`: air quality (141 stations), AED locations (710), public toilets (695, no native id — synthesised from index), events calendar (652 raw, 352 kept with real coordinates). Catalogued the rest (mostly transit/routing — Delta's BE-01/DATA-09 territory, and out-of-scope categories like real estate/participatory budget) without fetching. Full breakdown in `docs/DATA.md`. `ruff check backend` and `pytest backend/tests` pass (6 tests).
- Blocker: None.
- Next action: Wait for Delta's review on PR #35 (and PR #33). Once both merge, BE-02 (bounded places endpoint) can combine `backend/app/data/osm_places.py` and `backend/app/data/warsaw_open_data.py`.
- Updated at (include timezone): 2026-10-17 14:05 Europe/Warsaw
