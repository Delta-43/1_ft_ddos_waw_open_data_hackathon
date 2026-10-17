# Start here: frontend design handover (for Codex)

You are taking over the **design polish of the live Warsaw 2076 frontend** for Delta (`@Delta-43`). Issue: **#80**. Branch name: `delta/80-<short-task>`. Written 2026-10-17 evening by Delta's other agent after running the app and reading the code. Facts below were checked on `main` at that time; re-check anything that matters.

## 1. The job in one paragraph

Make the live app look and read like one confident product on desktop (1440×900) and phone (390×844), without breaking any data label, source credit, map attribution or API behaviour. The demo story: a user describes a quiet, green museum outing in Warsaw, compares candidate routes, and inspects place cards. Real routes and honest labels matter more than visual flair. **Feature freeze is 06:00 Sunday 18 October (Europe/Warsaw); absolute coding stop 06:30.** Submission is 11:00. Land small PRs early; do not leave a half-finished redesign on a branch.

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
- Accessibility must not regress: keyboard focus visible, `aria-*` already present, `prefers-reduced-motion` already honoured (`layout.css`, `map/routes.ts`, `map/intro.ts`). Contrast on the dark panels stays readable.

## 5. What exists (reviewed)

I ran `pnpm dev` against the shared backend and drove it in headless Chromium (SwiftShader), desktop and phone, with the prompt "A quiet green museum outing on foot". **No console errors; the full flow worked** (landing, open assistant, send, 3 ranked routes, route drawn with numbered stops). Screenshots: `docs/design-review/desktop-landing.jpg`, `desktop-results.jpg`, `mobile-results.jpg`. Regenerate with `node scripts/design-screenshots.mjs <dir>` (dev server on 5173 needed).

**Works well**
- Bright 3D game-style basemap, building extrusion, route highlight, intro fly-in.
- Route cards: clear title, `RECOMMENDED` chip, four metrics each with its own label.
- Top bar `LIVE RESPONSE` badge, bottom bar sources strip and drawer.
- Mobile uses a bottom sheet with `Routes · Stops` tabs.

**Rough, in my suggested priority order** (my judgement from screenshots, not user research)
1. **The explanation text appears twice**: in the route card and again in the assistant's chat reply. It is also one dense paragraph with long place names; the backend now appends opening-hours sentences ("Opening hours not known for: …", "… say closed on arrival: …"), so expect longer text. Needs hierarchy (short summary, details collapsed) and a decision on the duplicate.
2. **The call to action on the landing view is easy to miss**: two stacked hint pills at the top and a small "What's up for today?" bubble bottom-right. The prompt is only reachable after opening the bubble.
3. **Dark panels over a bright map** are a recorded decision (DECISIONS.md, 18:30 row: keep the dark Language-Explorer look). Make them feel intentional (spacing, type scale, borders) rather than changing the decision.
4. **Mobile**: the bottom sheet covers about half the map and the assistant bubble floats over the sheet edge and the map pins; check overlap, thumb reach and sheet heights.
5. **Pin clutter**: many hexagon pins and labels on the results view. I did not check whether the other two candidate routes are drawn or how the city pins dim while a route is shown (#72 says they dim).
6. **Thin blue line cluster** west of stop 1 in the desktop results screenshot. I did not find what draws it (possibly building-part outlines, `map/buildingOutlines.ts`, or a route layer). Find out before judging it.
7. Type and spacing are set per component in separate CSS files (`layout.css`, `results.css`, `places.css`, `provenance.css`, `preferences.css`); tokens exist only at `:root` in `src/style.css`. A small token pass (type scale, spacing, radii) would help consistency.

**Not reviewed** (check these yourself): the Stops tab on a phone, place pop-ups above stops, the Sources drawer, loading and error states, the empty-query error, a real phone, the historical overlay (#74, not merged), and the isometric mockup `mockups/warsaw-2076/` (pitch backup, mock data, not the live app).

## 6. Design language so far

Tokens in `frontend/src/style.css` `:root`: `--bg #000`, `--panel rgba(22,23,23,.94)`, `--rim #8ab4f8`, `--rim-faint #3c4043`, `--text #e8eaed`, `--muted #9aa0a6`, `--accent-strong #1a73e8`, `--ink #202124`. Look: near-black panels, grey until active, white when active, hairline greys, one blue accent, system font stack, letter-spaced "WARSAW 2076" wordmark, one gradient-ring "Find routes" button as the only colourful moving element. Easing `--ease-signature` in `layout.css`. Map colours live in `frontend/src/map/style.ts` (Alban's; do not edit).

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
