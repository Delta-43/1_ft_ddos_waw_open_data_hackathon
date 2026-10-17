"""Load the repository's .env into the process environment (no extra dependency).

Existing environment variables win, so a deployment can override any line.
"""
import os
from pathlib import Path

ENV_FILE = Path(__file__).resolve().parents[3] / ".env"


def load_env(path: Path = ENV_FILE) -> None:
    if not path.exists():
        return
    for line in path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        value = value.strip().strip("'\"")
        if value:
            os.environ.setdefault(key.strip(), value)
