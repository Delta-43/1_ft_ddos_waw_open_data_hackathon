#!/usr/bin/env bash
# Build and run the backend container stack (docs/DEPLOYMENT.md), bound to this
# machine's Tailscale address only - never 0.0.0.0 or a public interface.
#
# Usage:
#   scripts/run-on-tailscale.sh            # API only, port 8000
#   scripts/run-on-tailscale.sh --mcp      # API + MCP server, ports 8000/8001
#
# Idempotent: safe to re-run after a `git pull` to rebuild and restart.
set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")/.."

with_mcp=0
if [ "${1:-}" = "--mcp" ]; then
  with_mcp=1
fi

command -v docker >/dev/null || { echo "docker is required" >&2; exit 1; }
command -v tailscale >/dev/null || { echo "tailscale is required" >&2; exit 1; }

ts_ip=$(tailscale ip -4) || { echo "tailscale is not up (try: tailscale up)" >&2; exit 1; }
echo "Tailscale address: $ts_ip"

[ -f .env ] || { cp .env.example .env; echo "Created .env from .env.example - review it before continuing."; }

# Upsert BIND_ADDR in .env without disturbing other lines or secrets already set.
if grep -q '^BIND_ADDR=' .env; then
  sed -i.bak "s/^BIND_ADDR=.*/BIND_ADDR=${ts_ip}/" .env && rm -f .env.bak
else
  printf '\nBIND_ADDR=%s\n' "$ts_ip" >> .env
fi

if [ "$with_mcp" -eq 1 ] && ! grep -qE '^MCP_TOKEN=.+' .env; then
  echo "MCP_TOKEN is empty in .env - the mcp service will refuse to start until it's set." >&2
  echo "Generate one with: python3 -c 'import secrets; print(secrets.token_urlsafe(32))'" >&2
fi

if [ "$with_mcp" -eq 1 ]; then
  docker compose --profile mcp up -d --build
else
  docker compose up -d --build
fi

echo
echo "Waiting for the API to answer..."
for _ in $(seq 1 30); do
  if curl --fail --silent "http://${ts_ip}:8000/api/health" >/dev/null 2>&1; then
    echo "API is up: http://${ts_ip}:8000/api/health"
    curl --silent "http://${ts_ip}:8000/api/health"; echo
    if [ "$with_mcp" -eq 1 ]; then
      echo "MCP endpoint: http://${ts_ip}:8001/mcp (needs Authorization: Bearer <MCP_TOKEN>)"
    fi
    exit 0
  fi
  sleep 1
done

echo "API did not answer in time - check logs:" >&2
echo "  docker compose logs -f api" >&2
exit 1
