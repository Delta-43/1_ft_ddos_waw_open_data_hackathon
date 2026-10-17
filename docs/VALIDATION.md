# Starter validation

Verified locally on 16 October 2026:

- Ruff backend checks passed.
- Two backend tests passed: route response matches the shared schema; empty query returns HTTP 422.
- TypeScript check passed.
- Vite production build passed.
- Frozen frontend dependency installation passed.
- Live loopback smoke: Vite on 5173 forwarded health and route requests to FastAPI on 8000.
- Temporary verification servers were stopped after the smoke test.

Local Python was 3.14; CI is configured for Python 3.12 and still needs its first GitHub run.
The installed Starlette test client emitted a deprecation warning about HTTPX. It did not fail the tests.
The bundled pnpm 11.25.0 was used for the committed lockfile; esbuild is explicitly allowed to run its build script.
No remote repository, user invitations, ruleset, network changes, live-provider integrations, map, AI, or MCP implementation were created.
Cross-device Tailscale connectivity requires the team to run the documented manual checks.

These are historical reference-scaffold checks, not evidence that a fresh Saturday build passes. Each teammate uses SETUP.md and their own installed runtimes; rerun checks after recreation.
