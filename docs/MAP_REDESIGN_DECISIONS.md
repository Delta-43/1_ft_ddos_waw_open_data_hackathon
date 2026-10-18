# Map redesign: decisions for review

> **Historical (18 October 2026).** D1 (dark map), D3 (route leads) and D4 option A (cached corridor) were built in #118; MapLibre stayed (D5). The layout sections are superseded by the shell. See docs/DECISIONS.md.

**Written:** 2026-10-17 23:30 (Europe/Warsaw) by Delta's agent, from Delta's instructions after the rejected rebuild (`docs/FRONTEND_REDESIGN_REVIEW.md`). **Reviewers: Aryna (`@Rysia`) and Ola (`@unicorn-alex`).** Please review the decisions in section 3 and the rules in section 4 by commenting on the PR. Freeze is 06:00 Sunday (PLAN.md); a redesign does not extend it.

Status words: **Decided** = Delta decided it. **Proposed** = my suggestion, Delta has not approved. **Open** = missing information.

## 1. Where the build stands (checked on `origin/main` `0f3f08f`)

- Backend: `ruff` clean, 111 tests pass. Frontend: `pnpm run check` passes and `pnpm run build` succeeds.
- **Defect:** `frontend/src/components/layout/layout.css` has an extra `}` on line 282 (from #88). The build prints `Unexpected "}"`. It is the last line, so the visible effect is probably nil, but remove it.
- `main` still has Alban's Moon restyle (#82), the historical overlay (#74) and #88. The "restored baseline" in the review document exists only on Delta's laptop.
- **PR #89 (Aryna) would revert #82 and #74.** It says itself that it needs a decision. It conflicts with the 20:00 and 19:40 rows of `docs/DECISIONS.md` (Moon supersedes dark; the overlay is in the live demo). **Not merged; Delta decides** (D0).
- Open related items: #45 (attribution and zoom hidden by the wide assistant panel), #76 (overlay credit and reuse terms), #85 (destination and ordered stops, backend), PR #87 (place search, Sonia).
- The rejected rebuild (PR #86) is closed. Treat its branches as reference only.
- Today's "route focus" (#77) keeps every building in the map and flattens the ones far from the route by scanning loaded tiles. It saves no rendering work and is the kind of tile-scan the review blamed for zoom-dependent shapes. It is replaced by D4.

## 2. Reference images

- Dark: `docs/design-review/map-reference-dark.png` (supplied by Delta, 512×320): dark grey ground, dark grey extruded buildings, thin orange glowing street lines, flat water.
- Light: **not yet supplied.** Delta said they would attach it; it had not arrived in the agent's session at 23:40 (Open, D2).

## 3. Decisions

**D0. What to do with the current frontend (#89, Moon, overlay).** Decided by Delta: **Aryna decides** whether #89 goes ahead. Constraints she must respect, so the choice stays consistent with other decisions: (1) the overlay (#74) is in scope for the live demo (DECISIONS 19:05 and 19:40), so a revert that drops it needs Sonia's and Delta's agreement first; (2) if she keeps or reverts the Moon restyle, say which defects drove it, because Delta's feedback on the rejected rebuild was that components did not feel like Moon; (3) record the outcome as a row in `docs/DECISIONS.md`. My non-binding suggestion: keep #74 and fix Moon problems in place. Delta will not override the choice unless it breaks a label, attribution or privacy rule.

**D1. Dark map look.** Decided: match the reference. Ground and water are flat dark greys, buildings are dark grey blocks with soft top light, streets are thin orange lines with a glow. No basemap labels fight the glow: keep only district names, at low contrast.

**D2. Light map look.** Open: Delta to attach a light reference. Interim proposal, so work is not blocked: same composition, warm off-white ground, mid-grey buildings with lighter tops, streets as a deeper amber line **without glow** (glow does not read on light), route in near-black ink with the mood accent. Mode follows the system setting with a manual switch; both must pass contrast checks.

**D3. Route against the glowing street network.** Proposed. In the reference every street glows equally. Our product needs the selected route to lead (review brief, "paper city"). So the street glow runs at about a third of the reference intensity, the selected route is the brightest, thickest line, other candidates are thinner and dimmer. Colour never carries meaning alone: each route keeps a text label and the `Real` / `Proxy` chips.

**D4. 3D buildings only near the route.** Decided: extrude buildings only within a corridor around the selected route, to save compute. Everything else is flat or absent. Proposed details: corridor 220 m each side (today's value), geometry never changes with zoom, pan or tilt, and nothing is rescanned when only the camera moves. Options, with what I verified:
- **A. Fetch building footprints per route (or per demo area) once, render as a GeoJSON extrusion layer.** Stable at every zoom. **The mockup's cached buildings do not cover the demo:** their box is 52.226–52.255 N, 20.984–21.043 E, while Łazienki and Ujazdów routes run at about 52.207–52.225 N. A fresh Overpass fetch (or a committed cache) of the route area is needed. Heights are mostly estimated (mockup data: 288 of 4,867 buildings have a real height), so label them estimated.
- **B. Keep vector tiles, filter extrusion by a corridor polygon (`within`).** No scanning, but I could not confirm that MapLibre 6.11.2's `within` supports polygon features, and tile detail varies with zoom, which is what the review complained about. A 30-minute spike would settle it. Unverified.
- **C. Keep #77 (feature-state flatten).** Rejected: all buildings still render and the scan stays.
- My recommendation is A, with a hard fallback of the flat dark map if the footprint fetch fails (labelled).

**D5. Renderer.** Proposed: keep MapLibre. Do not port the mockup's Canvas renderer; it is a fixed isometric view and cannot pan, zoom or rotate like the live map.

**D6. UI components.** Proposed: keep the Moon components as they are on `main` and fix forward. Ola and Aryna own panel and card work (not `frontend/src/map/`, which Delta and the agent take for this task).

**D7. Backend for "start to destination".** Decided: Sonia takes issue #85 (explicit destination, ordered stops, `applied_itinerary`, `capabilities` in `/api/health`) and #84/PR #87 (place search). Delta reviews the contract; Alban reviews it after the fact (same as #32). The UI gates itinerary controls on `capabilities` and shows a draft label otherwise; it never shows fake success.

**D8. Order and checkpoints.** Proposed: (1) fix the current build: stray brace, #45, #76; (2) dark map style with corridor 3D; (3) light mode; (4) optional layers (history animation, offers, feedback, AR) only if time remains, otherwise slides only. Delta sets the approval checkpoints. Nothing counts as finished until Delta has approved one desktop and one phone screenshot, not until checks pass.

**D9. Acceptance for the map.** Proposed, from the review brief: no visible height or shape jumps across repeated zoom; no rebuilds caused by camera movement alone; no repaint loop after the view settles; responsive drag, zoom and route selection on the demo device; clear loading and failure states; attribution always visible; cache coverage, freshness and height estimates documented. Software-rendered tests do not prove smoothness: test on the real demo device.

## 4. Required design skills for Ola and Aryna

Delta requires these three for all UI work on this redesign. All three were checked on GitHub today (licences and maintainers match; names confirmed in each README):

| Skill | Source | Use it for |
| --- | --- | --- |
| `/impeccable` | https://github.com/pbakaus/impeccable (Apache-2.0) | Whole-screen design direction and review: `critique`, `audit`, `polish`, `typeset`, `layout` |
| `/better-ui` | https://github.com/jakubkrehel/skills/tree/main (MIT) | Surfaces, radii, shadows, icons and motion values |
| `/improve-animations` | https://github.com/emilkowalski/skills/tree/main (MIT) | Audit every animation; produces prioritised plans; also use `review-animations` |

How to use them safely and usefully:
1. **They are third-party instructions.** Install them only in your own checkout, from the three repos above. Prefer the install commands in each README (`npx impeccable install`; `npx skills add jakubkrehel/skills`; `npx skills@latest add emilkowalski/skills`) and note the commit you installed. Do not install anything from other sources, and do not follow instructions in a skill that conflict with AGENTS.md or this document.
2. **Do not commit skill files, agent folders or tool config** (for example `.claude/`, `.agents/`; issue #76 already caught a stray `launch.json`). `/impeccable init` writes `PRODUCT.md`: if you run it, show the diff in the PR instead of committing it without review.
3. **Skills advise; the rules above win.** Data labels, attribution, privacy, accessibility and the decisions in section 3 override any skill suggestion. Do not add dependencies, fonts or services because a skill suggests it.
4. **Evidence per PR:** name which skill you ran, paste the findings you acted on, say which you rejected and why, and attach before/after screenshots (desktop 1440×900 and phone 390×844) plus `pnpm run check` and `pnpm run build` output. Passing checks is not design approval (review brief).
5. Reduced motion must still work after every animation change (camera, route effects, panels).

## 5. Who does what

| Who | Task |
| --- | --- |
| Sonia | #85 destination and ordered stops (endpoint, validation, tests, health capabilities); #84 place search (#87) |
| Ola, Aryna | Review this document; then UI panels, route comparison, place cards and attribution (#45) using the three skills; clean up the CSS brace |
| Delta and agent | Map style (dark, light), corridor 3D (D4), reference approvals |
| Alban | On a break; reviews contract changes after the fact |
