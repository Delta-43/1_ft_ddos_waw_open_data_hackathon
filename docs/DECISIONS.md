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
| 2026-10-17 13:55 (UTC+02:00) | PR review and merging delegated to Delta's cloud agent: reviews posted as Delta, squash merge, merged branches auto-deleted. Ran until 16:08, then handed back to Delta's laptop | Delta | Keep reviews moving while Delta's computer was down |
| 2026-10-17 16:04 (UTC+02:00) | API-01 contract 1.0 (#32) merged by auto-merge on Ola's approval, without Alban's review. Alban reviews after the fact; changes go in a new contract PR | Delta | Unblock DATA-08, BE-01 and FE-01 route layers |
| 2026-10-17 (UTC+02:00) | Partial fixes link issues with `Refs #N`, not `Closes #N`. #8 was auto-closed by #38 and reopened for the routing-provider half | Delta | Keep issue status truthful |
| 2026-10-17 18:30 (UTC+02:00) | Frontend direction for the demo (Aryna, PR #62): the real app keeps the dark Language-Explorer look over Alban's bright map; Delta's isometric mockup (`mockups/warsaw-2076/`) is the pitch backup, not the live demo; place cards also open as pop-ups above numbered stops (as in the mockup); the then-and-now era layer and social walking (#68) are slides only | Aryna | Real routes and data labels are in the real app; the mockup is mock data; PLAN.md requires a contract and sign-off for stretch items before the freeze |

| 2026-10-17 19:05 (UTC+02:00) | Historical overlay (the 1935/1939/1945 toggle specifically, not #68's full then-and-now cultural-layer/social-walking scope) moves from "slides only" (PR #71, 18:30) to a live demo feature, built in PR #74 | Sonia, confirmed by the user in-session; Delta to confirm formally in #74's review | PR #71's "slides only" call predates discovering a real, working, freely-reusable data source (the city's own WMS orthophotomaps/plans, confirmed fee-exempt with mandatory attribution under Polish PSI reuse law) and verifying it end-to-end in a browser. Scope stays narrow: just the image toggle, not curated cards or social walking |

Record contract changes, provider choice, scope cuts, and any grace-period authorisation here.

Onboarding: STACK.md and SETUP.md contain the shared prerequisites. No personal agent skills or private infrastructure are required. Fresh Saturday implementation must be validated separately from the reference scaffold.
