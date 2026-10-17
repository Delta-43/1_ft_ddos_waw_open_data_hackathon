# Warsaw 2076

Personalised city navigation for the Warsaw Open Data Hackathon.

## Start here

1. Read `AGENTS.md`, `STACK.md`, `SETUP.md`, `IDEA.md`, and `PLAN.md`.
2. Read your `team/<name>/PROMPT.md` and update your `STATUS.md`.
3. Delta bootstraps GitHub and branch protection using `docs/GITHUB.md` before feature work.
4. Both pairs agree on `contracts/route.schema.json` and its example.
5. Follow `docs/DEVELOPMENT.md` to run the starter and connect across devices.
6. Claim one issue from `TODO.md`; use a separate branch and checkout per person.

The organisers confirmed on 17 October that this starter may be used. Earlier projects remain research only: do not import their code, snapshots or credentials.

Repository: https://github.com/Delta-43/1_ft_ddos_waw_open_data_hackathon. Tasks are GitHub issues; see TODO.md for the index.

Privacy: User data stays on the user's device. The backend keeps no user profiles, preferences or trip history; route requests are stateless. A future version sends personal context only per request, with a short-lived scoped token. See IDEA.md, Privacy and security.

## Layout

| Directory | Purpose / owner |
| --- | --- |
| `backend/app/` | FastAPI, routing, AI, and shared services / Delta |
| `backend/tests/` | Backend and contract checks / backend pair |
| `frontend/src/` | React interface / Alban, Ola and Aryna |
| `contracts/` | Shared API schemas and examples / Delta + Alban |
| `data/fixtures/` | Versioned demo inputs / Sonia |
| `data/local/` | Ignored local databases and cached data |
| `docs/` | Development, GitHub, data, and pitch instructions |
| `team/` | Agent prompts and short handover notes |
| `.github/` | CI and contribution templates |

The starter proves connectivity using an explicitly mocked route. It does not implement a map, street routing, AI, SQLite persistence, or MCP yet.
