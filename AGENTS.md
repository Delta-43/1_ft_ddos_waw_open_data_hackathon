# Team and coding agent instructions

## Goal and scope

Build one complete demo: describe a quiet, green museum outing in Warsaw, compare candidate routes, and inspect place cards.
Read `STACK.md` and `SETUP.md` first; all shared instructions are self-contained. No personal agent skills or private tools are required.
Read `IDEA.md` for the broader concept. `PLAN.md` controls scope and deadlines.

## Ownership

- Delta (expert) + Sonia (novice): backend. Delta owns architecture, routing, AI/MCP, integration, and the contract with Alban. Sonia owns data imports, fixtures, provenance, and bounded place endpoints.
- Alban (expert) + Ola (novice): frontend. Alban owns map/rendering, frontend integration, and presentation design. Ola owns preference forms, place cards, and loading/error states.
- Delta leads pitch conception and delivery. Alban leads presentation design. Sonia and Ola support evidence, screenshots, and rehearsal.

## Mandatory stop

Stop feature work five hours before the confirmed submission deadline. Reserve the remainder for pitch, slides, rehearsal, and submission.
Only Delta may invoke a grace period of up to 30 minutes for an existing demo-blocking defect. No new features or redesigns.
The absolute coding stop is 4.5 hours before submission. Record any grace decision in `docs/DECISIONS.md`.
See `PLAN.md` for the provisional Warsaw times. Recalculate if organisers change the deadline.

## Agent workflow

- Start with your personal `team/<name>/PROMPT.md`, current GitHub issue, and `STATUS.md`.
- One person, one working checkout, one feature branch, one active issue. Never share a mutable checkout between agents.
- Use GitHub issues as task truth; `TODO.md` is the initial backlog. Status files are handovers, not duplicate boards.
- Make small PRs. State what changed, why, checks run, and any mocked behaviour. Link `Closes #N`.
- The other person in your pair reviews. Delta or Alban reviews novice PRs; an expert reviews shared contracts or architecture.
- Do not directly push to main, merge your own PR, force-push shared branches, or hide failing checks.
- Run relevant checks before review. Never claim an unrun check passed.
- Agree shared schemas with Delta and Alban before changing them. Keep frontend fixtures compatible.
- Keep secrets out of Git, frontend environment variables, screenshots, logs, and fixtures.
- Do not add a framework, service, large dependency, migration, or paid API without your pair's expert agreeing.
- Finish and integrate the thin demo before stretch goals. Prefer deterministic fixtures over unreliable live dependencies during the pitch.
- Do not implement AR, advertising, personal account integrations, or full multimodal routing during the core build.

## Technical boundaries

FastAPI + Pydantic, SQLite local to backend, React + Vite + TypeScript, MapLibre for the map.
Use GeoJSON coordinates in longitude, latitude order. Units are metres and seconds. Dates include timezone offsets.
The model interprets preferences and explains grounded results; code/API data supplies routes, opening times, and estimates.
REST and MCP call shared Python services. Do not implement two route planners.
Clearly label mock/live/cached data and straight-line demo geometry. Fixtures must not masquerade as real routes.

## Shared development and access

All members use their own local checkout, GitHub login, editor and optional coding agent.
Follow SETUP.md and docs/DEVELOPMENT.md; do not depend on another person's home directory or tool bundle.
Teammates browse the shared demo using a URL supplied by Delta. They do not need SSH, a service account, private server access or administrator privileges.
Delta alone manages network membership, credentials, shared server processes and optional owner-specific operations.
Do not alter Tailscale policy, firewall, credentials or shared servers as part of a feature task.
Private owner notes are outside the shared Git repository. Do not request them as a prerequisite for development.
