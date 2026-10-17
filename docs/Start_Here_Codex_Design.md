# Start here: frontend design handover (for Codex)

You are taking over the **design polish of the live Warsaw 2076 frontend** for Delta (`@Delta-43`). Issue: **#80**. Branch name: `delta/80-<short-task>`. Written 2026-10-17 evening by Delta's other agent after running the app and reading the code. Facts below were checked on `main` at that time; re-check anything that matters.

> **Update 2026-10-17 23:45:** the Moon direction below is superseded. The overlay UI is back to Aryna's dark design (#89; DECISIONS.md 23:45 row). Do not restyle toward Moon; polish the dark design instead.

## 1. The job in one paragraph

Finish the **Moon Design System v1** look across the live app, so it reads as one confident product on desktop (1440×900) and phone (390×844), without breaking any data label, source credit, map attribution or API behaviour. Alban's #82 moved the overlay UI from the dark Language-Explorer theme to Moon (white surfaces, black as the one accent, pill buttons); Delta chose Moon on 2026-10-17 (DECISIONS.md, 20:00 row). Your job is to finish and tighten that pass, not to start another one. The demo story: a user describes a quiet, green museum outing in Warsaw, compares candidate routes, and inspects place cards. Real routes and honest labels matter more than visual flair. **Feature freeze is 06:00 Sunday 18 October (Europe/Warsaw); absolute coding stop 06:30.** Submission is 11:00. Land small PRs early; do not leave a half-finished redesign on a branch.

## 2. Read first, in order

1. `AGENTS.md` (rules), `docs/DECISIONS.md` (the last rows are the frontend decisions), `contracts/README.md`.
2. `frontend/README.md`, `frontend/src/api/contract.ts` (the typed API shape).
3. `team/ola/STATUS.md`, `team/aryna/STATUS.md`, `team/alban/STATUS.md` (handovers; Alban's is stale).

## 3. Who owns what (ask before editing their files)

| Person | Owns | Status |
| --- | --- | --- |
| Alban `@kaveOO` | Map, rendering, frontend integration, presentation design (`frontend/src/map/`, `markers/`, `App.tsx`, layout) | **On a break from 19:20; Ola covers** |
| Ola `@unicorn-alex` | Preference form, assistant widget, loading/error states (`components/preferences/`) | Covering Alban; reviews your PRs |
| Aryna `@Rysia` | Place cards, source labels, pop-ups (`components/places/`, `components/provenance/`) | Active |
| Delta | Backend, contract, pitch | Merges and approves |

Keep your changes to CSS and presentational components. Do **not** change `frontend/src/map/`, `frontend/src/api/`, the contract, or anything in `backend/` without Ola's/Delta's agreement. Never push to `main`, never merge your own PR, never force-push a shared branch. Open small PRs: what changed, why, checks run, `Refs #80`. Pair review: Ola.

## 4. Non-negotiable constraints

- **Data honesty.** Every metric keeps its source label (`Real`, `Proxy`, `Simulated`, `Cached`, `Historical`; `components/provenance/SourceLabel.tsx`). Green and quiet are **proxies**: call them estimates, never "measured", "shade", "canopy" or "noise level" (`docs/DATA.md`, DATA-07). Do not write copy that implies live traffic, live vehicles, real bookings or measured air quality. The cached air-quality readings are hours old and are reported stale on purpose.
- **Attribution always visible**: OpenFreeMap, OpenMapTiles, © OpenStreetMap (ODbL), Urząd m.st. Warszawy (CC BY). Issue #45: the expanded assistant panel must not hide the zoom controls or the attribution. Do not make it worse.
- **Privacy.** No accounts, no tracking, no storing preferences or locations server-side. Keep "We don't store your requests or location" visible.
- **No new dependency, framework, font service or paid API** without Ola's/Delta's agreement. CSS in the existing files; plain CSS custom properties.
- Coordinates are longitude, latitude. Units are metres and seconds.
- **Moon only.** Use the `--moon-*` tokens in `src/style.css`; do not reintroduce the dark theme or add a second palette. The legacy names (`--panel`, `--text`, `--rim`…) are aliases kept for old selectors; prefer the `--moon-*` names in new CSS. Averta is a licensed font: do not add a font file or font service, keep the fallback stack.
- Accessibility must not regress: keyboard focus visible (`--moon-focus` ring), `aria-*` already present, `prefers-reduced-motion` already honoured (`layout.css`, `map/routes.ts`, `map/intro.ts`). Text on white must meet WCAG AA: use `--moon-bulma` or `--moon-trunks` for text, never `--moon-faint`; Krillin/Chichi support colours only with a text label and their `-ink` variants for text. Panels sit over a bright map, so keep their shadow or hairline border so they don't dissolve into it.

## 5. What exists (reviewed)

I ran `pnpm dev` against the shared backend and drove it in headless Chromium (SwiftShader), desktop and phone, with the prompt "A quiet green museum outing on foot". **No console errors; the full flow worked** (landing, open assistant, send, 3 ranked routes, route drawn with numbered stops). Screenshots: `docs/design-review/desktop-landing.jpg`, `desktop-results.jpg`, `mobile-results.jpg`. **These show the old dark theme, taken before #82; your first step is to regenerate them on Moon** with `node scripts/design-screenshots.mjs <dir>` (dev server on 5173 needed) and re-check the list below against them. Layout and behaviour findings still apply; colour findings do not.

**Works well**
- Bright 3D game-style basemap, building extrusion, route highlight, intro fly-in.
- Route cards: clear title, `RECOMMENDED` chip, four metrics each with its own label.
- Top bar `LIVE RESPONSE` badge, bottom bar sources strip and drawer.
- Mobile uses a bottom sheet with `Routes · Stops` tabs.

**Rough, in my suggested priority order** (my judgement from screenshots, not user research)
1. **The explanation text appears twice**: in the route card and again in the assistant's chat reply. It is also one dense paragraph with long place names; the backend now appends opening-hours sentences ("Opening hours not known for: …", "… say closed on arrival: …"), so expect longer text. Needs hierarchy (short summary, details collapsed) and a decision on the duplicate.
2. **The call to action on the landing view is easy to miss**: two stacked hint pills at the top and a small "What's up for today?" bubble bottom-right. The prompt is only reachable after opening the bubble.
3. **Finish the Moon pass consistently.** #82 restyled the overlay components; check every state it may have missed (loading, errors, empty query, Sources drawer, place pop-ups above stops, the historical-overlay button and its credit label from #74, the map's zoom/reset controls next to Moon panels) and bring them onto the same tokens, radii and type scale. White panels over the bright map need their shadow or border to stay legible.
4. **Mobile**: the bottom sheet covers about half the map and the assistant bubble floats over the sheet edge and the map pins; check overlap, thumb reach and sheet heights.
5. **Pin clutter**: many hexagon pins and labels on the results view. I did not check whether the other two candidate routes are drawn or how the city pins dim while a route is shown (#72 says they dim).
6. **Thin blue line cluster** west of stop 1 in the desktop results screenshot. I did not find what draws it (possibly building-part outlines, `map/buildingOutlines.ts`, or a route layer). Find out before judging it.
7. Type and spacing are set per component in separate CSS files (`layout.css`, `results.css`, `places.css`, `provenance.css`, `preferences.css`). #82 added Moon radii, shadows and a base type size at `:root`; there is still no shared spacing scale. Use Moon's sizes (text-md 14/24, text-sm semibold 12/16; radii 8/16/24/pill) consistently rather than per-file values.

**Not reviewed** (check these yourself): the Stops tab on a phone, place pop-ups above stops, the Sources drawer, loading and error states, the empty-query error, a real phone, the historical overlay (#74, now merged: toggle button top-right, credit label bottom-left while a year is on), and the isometric mockup `mockups/warsaw-2076/` (pitch backup, mock data, not the live app).

## 6. Design language: Moon Design System v1

Source: Moon Design System v1 Figma community kit (link in #82). Tokens in `frontend/src/style.css` `:root`:

| Role | Token | Value |
| --- | --- | --- |
| Panels, cards | `--moon-gohan` | `#fff` |
| Page background | `--moon-goku` | `#f6f7f9` |
| Subtle fill / hover | `--moon-fill` / `--moon-fill-hover` | 4% / 8% black |
| Hairline border | `--moon-beerus` | `#ebebeb` |
| Text, primary action | `--moon-bulma` | `#000` |
| Text on black | `--moon-goten` | `#fff` |
| Secondary text (AA) | `--moon-trunks` | 60% black |
| Disabled only | `--moon-faint` | 25% black |
| Warning / error (with a label) | `--moon-krillin` (`-ink`) / `--moon-chichi` (`-ink`) | `#ffb319` / `#ff4e64` |
| Radii | `--moon-radius-sm/md/lg/full` | 8 / 16 / 24 / 100px |
| Shadows | `--moon-shadow-sm` / `--moon-shadow-lg` | soft, 16% black |
| Focus | `--moon-focus` | white then black 2px ring |
| Font | `--moon-font` | Averta stack with system fallbacks |

Look: white floating surfaces with soft shadows over the bright map, black as the only accent, pill-shaped buttons, 4% black fills for secondary rows, `color-scheme: light`. Keep the letter-spaced "WARSAW 2076" wordmark. Easing `--ease-signature` in `layout.css`. Map colours live in `frontend/src/map/style.ts` (Alban's; do not edit).

## 7. Code map

```
frontend/src/
  App.tsx, useOuting.ts        page composition and the request/response state
  components/layout/           TopBar, HintPill, PreferenceChips, layout.css (intro, top bar, sources bar)
  components/preferences/      AssistantWidget, PromptForm, preferences.css   (Ola)
  components/results/          ResultsPanels (tabs), RouteComparison (cards), results.css
  components/places/           PlaceCard(List), PlacePopup, places.css        (Aryna)
  components/provenance/       SourceLabel, DataModeBadge, SourcesStrip/Drawer, MapCredits   (Aryna)
  map/ markers/ data/ api/     map, pins, data loading, typed client          (Alban, hands off)
```

## 8. Run it

```bash
cd frontend && pnpm install --frozen-lockfile
# Shared backend on the Tailscale network (Delta's host, while it is up):
API_PROXY_TARGET=http://100.65.141.58:8000 pnpm dev
# or run the backend yourself: python -m uvicorn app.main:app --app-dir backend --port 8000  (see docs/DEVELOPMENT.md)
```

Open http://127.0.0.1:5173. Keep explicit Vite host allow-lists; never set `allowedHosts` to true. The backend is stateless and returns live OSRM routes, or labelled straight lines if routing fails. Tiles load online: have a screenshot or recording as the fallback.

## 9. Checks and evidence (before every PR)

```bash
cd frontend && pnpm run check && pnpm run build     # CI runs the same two commands
node scripts/design-screenshots.mjs /tmp/shots      # desktop + phone, prints console errors
```

Put before/after screenshots in the PR description or attach them. Say what you did **not** test (a real phone, other browsers, slow networks). Never claim an unrun check passed.

## 10. Handover

Update `team/delta/STATUS.md` on your branch when you stop: current issue, branch/PR, last verified result, blocker, exact next action, timestamp with timezone. No secrets. Record scope decisions in `docs/DECISIONS.md`. At the 06:00 freeze, stop and support pitch preparation: screenshots of route cards, labels and pop-ups for the slides, and a rehearsal pass.
