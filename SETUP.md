# Set up your own computer

## Tools

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

The repository is `Delta-43/1_ft_ddos_waw_open_data_hackathon` (private). The organisers approved using the starter.

```bash
git clone https://github.com/Delta-43/1_ft_ddos_waw_open_data_hackathon.git
cd 1_ft_ddos_waw_open_data_hackathon
git switch -c YOURNAME/ISSUE-short-task
```

Use a unique directory and branch for each person. Read AGENTS.md → STACK.md → PLAN.md → your personal PROMPT.md → assigned issue.
No private filesystem paths, SSH access, or custom tools are needed. Create issues/PRs using github.com if gh is unavailable.

## Run it

The quickest way is Docker: `docker compose up -d --build`, then http://localhost:4173 (see README.md).
For development without Docker (backend with Uvicorn, frontend with `pnpm dev`, checks and data rebuilds),
follow docs/DEVELOPMENT.md. No API keys are needed: without a model key, outings are picked by keyword match.

## Check and hand over

Use docs/DEVELOPMENT.md for checks, error cases and shared-demo connections.
Run backend lint/tests and frontend TypeScript/build before requesting review. Record commands and failures honestly.
Create a PR linked to your issue, request your pair reviewer, and update your STATUS.md.
If access or a provider fails, tell your pair expert after 15 minutes; continue against the agreed labelled fixture.

## Shared demo is optional for setup

Your local app should work before joining the shared demo. Install Tailscale from https://tailscale.com/download and sign in with your own account if needed.
Delta invites your verified login and supplies the demo URL. Browse it; no SSH or administrator access is required.
Only Delta manages tailnet membership/policy. Do not assume being a GitHub collaborator grants network access.
