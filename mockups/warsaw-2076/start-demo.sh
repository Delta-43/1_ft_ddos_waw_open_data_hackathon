#!/usr/bin/env bash
# Run from any directory. Optional first argument: port (default 5179).
set -euo pipefail
script_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
exec python3 "$script_dir/tools/serve-vpn.py" "$@"
