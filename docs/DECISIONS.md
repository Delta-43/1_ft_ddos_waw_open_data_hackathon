# Decisions

| Date/time (Europe/Warsaw) | Decision | Owner | Reason |
| --- | --- | --- | --- |
| 2026-10-17 (confirmed) | Deadline 11:00 Sunday 18 October. Feature freeze = submission minus five hours; exceptional fixes end 30 minutes later | Delta | Protect pitch preparation |
| 2026-10-17 | Aryna joins the frontend pair as a novice. She takes FE-03 (place cards) and DATA-08 (source labels); Ola keeps FE-02 and loading/error states | Delta | Balance frontend work across two novices |
| 2026-10-17 | Milestones and achievements added to IDEA.md as a stretch idea, not core scope | Delta | Improves engagement; core demo comes first |
| 2026-10-17 | Privacy principle: user data stays on the device and is sent only per request with a scoped token. Demo backend stores no user data | Delta | User trust; keeps the demo consistent with the target design |
| 2026-10-17 | Organisers approved building on the starter | Delta | Confirmed at kickoff |
| 2026-10-17 | GitHub bootstrap done: private repo, five collaborators, branch protection (PR, 1 approval, both checks), squash-only, CODEOWNERS, labels, issues #3 and #5–#29 | Delta | BOOT-01 |
| 2026-10-17 | Merge rule kept as GitHub allows: Delta may override the approval requirement as owner; everyone else, including Alban, needs one approval | Delta | Personal repositories cannot exempt named collaborators |
| 2026-10-17 | Merged PR #4 (FE-01 map groundwork) with Delta's override; MapLibre dependency and OpenFreeMap tiles approved | Delta | Unblock frontend work; CI green |
| 2026-10-17 | Optional 10-minute git autosync script (`scripts/git-autosync.sh`); fast-forwards `main` only | Delta | Keep checkouts current without touching feature branches |
| 2026-10-17 (UTC+02:00) | Basemap: MapLibre GL JS 6.11.2 with OpenFreeMap vector tiles (OpenMapTiles schema), custom dark style; no key or account | Alban | Free, keyless, real building heights; attribution (OpenFreeMap, OpenMapTiles, OpenStreetMap/ODbL) always visible. Online tiles: keep a recording fallback |
| 2026-10-17 (UTC+02:00) | Google Photorealistic 3D Tiles tried and removed; OSM building colours removed. Buildings stay untextured (dark palette), with OSM building parts and rendering optimisations kept | Alban | Owner decision; Google key needed billing, returned sporadic tile 404s, and Google restricts 3D Tiles for EEA projects. No Google calls remain |
| 2026-10-17 (UTC+02:00) | Bright game-map style: GTA V-like ground (cyan water, green parks, white roads, district outlines) with AC Unity-like light 3D buildings; untextured | Alban | Owner request for a brighter, cleaner map; colours only, no measured frame-time change (orbit benchmark 64 ms) |

Record contract changes, provider choice, scope cuts, and any grace-period authorisation here.

Onboarding: STACK.md and SETUP.md contain the shared prerequisites. No personal agent skills or private infrastructure are required. Fresh Saturday implementation must be validated separately from the reference scaffold.
