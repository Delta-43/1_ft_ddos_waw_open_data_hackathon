#!/usr/bin/env sh
# Starts the whole demo (web app + API) in containers on this machine, reachable over Tailscale.
#   scripts/demo-up.sh            build and start, print the URL
#   scripts/demo-up.sh down       stop (the data volume is kept)
# Needs Docker with Compose v2. Optional settings go in .env (see .env.example).
set -eu
cd "$(dirname "$0")/.."

if [ "${1:-}" = "down" ]; then
  docker compose down
  exit 0
fi

# Publish only on this machine's Tailscale address (never 0.0.0.0); fall back to this machine only.
BIND_ADDR="${BIND_ADDR:-$(tailscale ip -4 2>/dev/null | head -n 1 || true)}"
BIND_ADDR="${BIND_ADDR:-127.0.0.1}"
# 4173 is one of the ports teammates' devices may reach in the Tailscale rules.
WEB_PORT="${WEB_PORT:-4173}"
export BIND_ADDR WEB_PORT

docker compose up -d --build api web
echo "Waiting for the app to answer..."
for _ in $(seq 1 60); do
  if curl -fsS "http://$BIND_ADDR:$WEB_PORT/api/health" >/dev/null 2>&1; then
    echo "Find YOUR way is live: http://$BIND_ADDR:$WEB_PORT"
    exit 0
  fi
  sleep 2
done
echo "The app did not answer in time; see: docker compose logs web api" >&2
exit 1
