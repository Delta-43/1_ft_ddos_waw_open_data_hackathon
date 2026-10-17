# Set up your own computer

## Before Saturday

Install Git, Node.js 22 (with npm), and Python 3.12 using the official installers or your normal package manager.
Official downloads: https://git-scm.com/downloads , https://nodejs.org/en/download , https://www.python.org/downloads/ .
On Windows, use WSL2/Ubuntu for the Bash commands below, or use the PowerShell alternatives where supplied.
If Python 3.12 is not available through your OS installer, use a Python version manager such as uv and `uv python install 3.12`; do not silently use a different version.
GitHub CLI is optional. Sign in to github.com using your own account and accept the repository invitation from Delta.
Install your preferred coding agent only if you want one. All project instructions live in the repository.

```bash
git --version
node --version
npm --version
npm install --global pnpm@11.25.0
pnpm --version
python3.12 --version
```

On Windows outside WSL, use `py -3.12 --version`. If npm's global installation reports permissions errors, use a user-owned Node installation; do not copy Delta's privileged commands.

## Repository and issue

Delta confirms OWNER/REPO and whether starter code is permitted. Replace placeholders before executing:

```bash
git clone https://github.com/OWNER/REPO.git
cd REPO
git switch -c YOURNAME/ISSUE-short-task
```

Use a unique directory and branch for each person. Read AGENTS.md → STACK.md → PLAN.md → your personal PROMPT.md → assigned issue.
No private filesystem paths, SSH access, or custom tools are needed. Create issues/PRs using github.com if gh is unavailable.

## Saturday: fresh build

Do not import earlier application code or snapshots. Confirm organiser rules with Delta first.
The existing scaffold demonstrates file layout and a contract only. If a clean event repository is required, recreate the application there during the event.

Backend pair: create `backend/app`, `backend/tests`, and a virtual environment; install FastAPI, Uvicorn, Pydantic, HTTPX, Pytest, jsonschema and Ruff.
Record dependencies in backend/requirements.txt. Implement health and mocked route endpoints against the agreed contract before adding sources.
Frontend pair: scaffold React/TypeScript with `pnpm create vite frontend --template react-ts` **only in an empty frontend directory**.
Agree the generated Vite version, scripts and lockfile with Alban/Delta. Adapt CI to actual scripts; never report the reference CI as validated against newly generated code.
Then add MapLibre and choose a tile provider once the thin flow works.

## Running the reference layout or event equivalent

From the repository root, Bash:

```bash
python3.12 -m venv .venv
source .venv/bin/activate
python -m pip install -r backend/requirements.txt
python -m uvicorn app.main:app --app-dir backend --host 127.0.0.1 --port 8000 --reload
```

PowerShell virtual environment: `py -3.12 -m venv .venv`, then `.venv\Scripts\Activate.ps1`.
If activation is unavailable, invoke `.venv\Scripts\python.exe` directly instead of weakening system policy.

In a second terminal:

```bash
cd frontend
pnpm install --frozen-lockfile
pnpm dev
```

Open http://127.0.0.1:5173 and http://127.0.0.1:8000/docs .
Frontend requests use relative `/api` paths. Configure Vite to proxy them to http://127.0.0.1:8000 .
SQLite needs no server, account or port. No API keys are needed for fixture mode.

## Check and hand over

Use docs/DEVELOPMENT.md for checks, error cases and shared-demo connections.
Run backend lint/tests and frontend TypeScript/build before requesting review. Record commands and failures honestly.
Create a PR linked to your issue, request your pair reviewer, and update your STATUS.md.
If access or a provider fails, tell your pair expert after 15 minutes; continue against the agreed labelled fixture.

## Shared demo is optional for setup

Your local app should work before joining the shared demo. Install Tailscale from https://tailscale.com/download and sign in with your own account if needed.
Delta invites your verified login and supplies the demo URL. Browse it; no SSH or administrator access is required.
Only Delta manages tailnet membership/policy. Do not assume being a GitHub collaborator grants network access.
