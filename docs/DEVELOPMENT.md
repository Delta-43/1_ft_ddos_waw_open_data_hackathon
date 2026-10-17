# Local development and shared testing

Read SETUP.md for installation and Windows alternatives. The organisers approved the starter. Commands below assume the agreed reference layout.

## Prerequisites

Use Python 3.12, Node.js 22, and pnpm 11.25.0. Run `npm install --global pnpm@11.25.0` once if needed.
Use your own installed runtimes. No Codex runtime bundle or owner-specific filesystem path is needed.
Do not commit machine-specific runtime paths. Never run installation as root unless the owner explicitly agrees.

## Backend: terminal one

From the project root:

```bash
python3.12 -m venv .venv
source .venv/bin/activate
python -m pip install -r backend/requirements.txt
cp .env.example .env
python -m uvicorn app.main:app --app-dir backend --host 127.0.0.1 --port 8000 --reload
```

`.env` is a future integration template; the starter does not load it or call external services.
Delta must explicitly load settings when adding providers. Keep keys on the backend.
The API documentation is at `http://127.0.0.1:8000/docs`.

## Frontend: terminal two

```bash
cd frontend
pnpm install --frozen-lockfile
pnpm dev
```

Open `http://127.0.0.1:5173`. The starter calls relative `/api/routes`; Vite forwards `/api` to the backend.
No CORS configuration is needed for this path. Never hard-code the developer's localhost into browser-side API URLs.

## Shared integration: teammate instructions

Delta publishes the demo URL and confirms it is reachable through Tailscale. Use your own Tailscale login and accept Delta's invitation.
Do not SSH to the host, request its service account, or restart its servers. Delta operates the shared host; Alban coordinates frontend updates with Delta.
Personal work stays in your local checkout. After review and merge, Delta updates the integration checkout and runs its smoke check.

If testing your local frontend against the shared backend, first ask Delta for the approved backend URL and confirm it is reachable.
In Bash, run `API_PROXY_TARGET=http://APPROVED_HOST:8000 pnpm dev` from frontend; replace APPROVED_HOST with the supplied name/address.
In PowerShell, set `$env:API_PROXY_TARGET="http://APPROVED_HOST:8000"`, then run `pnpm dev`.
The proxy target is resolved on the Vite host. Browser code still uses relative `/api` URLs.
If remote access is unavailable, continue with a local backend or labelled fixture. Local setup does not depend on shared services.

Do not change network rules or expose a development server publicly. Keep explicit Vite hostname allowlists; never set allowedHosts to true.
SQLite stays backend-local. Keys stay backend-only. PWA installation over a network needs a secure context, so defer it until HTTPS is deliberately configured.

## Staying up to date (optional)

`scripts/git-autosync.sh` fetches from GitHub and fast-forwards your local `main` every time it runs. It never merges, rebases or resets your feature branch, and it skips the update if you are on `main` with uncommitted changes. To bring new `main` work into your branch, run `git rebase main` or `git merge main` yourself.

Run it every 10 minutes with cron (Linux, macOS, or WSL2). Replace the path with your own checkout:

```bash
chmod +x scripts/git-autosync.sh
( crontab -l 2>/dev/null; echo "*/10 * * * * $PWD/scripts/git-autosync.sh $PWD >> $HOME/.git-autosync.log 2>&1" ) | crontab -
```

To turn it off, run `crontab -e` and delete the line. Git must be able to fetch without a prompt, for example after `gh auth setup-git`. Check `~/.git-autosync.log` if `main` stops updating.

On Windows without WSL, run `git fetch origin main:main` from your checkout when you need fresh changes, or ask Alban or Delta for help with Task Scheduler.

## Automated checks

From the project root with the virtual environment active:

```bash
ruff check backend
PYTHONPATH=backend python -m pytest backend/tests -q
cd frontend
pnpm run check
pnpm run build
```

`pnpm install --frozen-lockfile` must succeed on a clean clone. If dependencies change, commit the updated lockfile in the same PR.

## Live service checks

```bash
curl --fail http://127.0.0.1:8000/api/health
curl --fail -H 'Content-Type: application/json' -d '{"query":"A quiet museum outing"}' http://127.0.0.1:8000/api/routes
curl --fail -H 'Content-Type: application/json' -d '{"query":"A quiet museum outing"}' http://127.0.0.1:5173/api/routes
```

For the shared server, use the demo URL supplied by Delta from a teammate device.
Also check: empty input, unavailable backend, repeated submissions, selected-route change, loading/error display, and honest data labels.
The starter offers one synthetic route and JSON output. Map rendering and multiple candidates are assigned tasks, not completed features.

When real providers are added, verify one known request per provider, record freshness/coverage, apply a timeout, and test fallback without credentials.
AI should return structured preferences and grounded explanations. Street routing supplies geometry; do not ask the model to invent it.
For MCP, Delta chooses and pins a compatible official Python SDK and client, exposes shared services, and records a successful client tool call.
MCP is not implemented by this scaffold. Do not expose an unauthenticated MCP endpoint outside the restricted development network.

## Pitch reliability

Tag or record the final verified commit before the freeze. Keep fixture mode, screenshots, and a recorded end-to-end demo.
Online tiles may fail even when API fixtures work. A PWA service worker needs a secure context outside localhost; plain HTTP over Tailscale is not enough.
Treat PWA installation as stretch work with HTTPS configured deliberately, not as a requirement for the core demo.

References: [Vite server and proxy options](https://vite.dev/config/server-options), [MCP Python SDK](https://py.sdk.modelcontextprotocol.io/).
