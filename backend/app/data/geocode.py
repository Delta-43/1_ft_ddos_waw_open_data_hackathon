"""Bounded, cached address geocoding via OSM Nominatim.

Follows Nominatim's usage policy (https://operations.osmfoundation.org/policies/nominatim/):
at most 1 request/second, single-threaded, a real identifying User-Agent,
and results cached so repeat runs do not re-hit the service. This is a
one-time event-time lookup for ~300 addresses, not a live/online geocoder;
do not call it from a request handler.
"""
import json
import time
from pathlib import Path
from typing import Any

import httpx

ROOT = Path(__file__).resolve().parents[3]
CACHE_PATH = ROOT / "data/local/geocode_cache.json"

NOMINATIM_URL = "https://nominatim.openstreetmap.org/search"
USER_AGENT = "warsaw2076-hackathon/1.0 (+https://github.com/Delta-43/1_ft_ddos_waw_open_data_hackathon)"
MIN_INTERVAL_SECONDS = 1.1  # Nominatim policy: max 1 req/s; stay under it.
RATE_LIMIT_ATTEMPTS = 4  # retries on 429/5xx before giving up on this query for this run
RATE_LIMIT_BACKOFF_SECONDS = 5.0

ATTRIBUTION = "© OpenStreetMap contributors, https://www.openstreetmap.org/copyright (ODbL)"


class GeocodingUnavailable(RuntimeError):
    """Nominatim could not give a definitive answer (rate-limited or
    erroring) after retries. Distinct from a definitive "not found" — the
    caller should stop rather than treat this as missing data."""


def _load_cache() -> dict[str, Any]:
    if CACHE_PATH.exists():
        return json.loads(CACHE_PATH.read_text())
    return {}


def _save_cache(cache: dict[str, Any]) -> None:
    CACHE_PATH.parent.mkdir(parents=True, exist_ok=True)
    CACHE_PATH.write_text(json.dumps(cache, indent=2, ensure_ascii=False))


class Geocoder:
    """Single-threaded, rate-limited, cache-backed Nominatim client."""

    def __init__(self, cache: dict[str, Any] | None = None):
        self.cache = cache if cache is not None else _load_cache()
        self._last_request = 0.0

    def geocode(self, query: str) -> dict[str, float] | None:
        """Returns {"longitude": ..., "latitude": ...} or None if Nominatim
        gave a definitive "no results" for this query. Results are cached
        by exact query string, including definitive misses, so a bad
        address is not retried every run.

        A rate-limited or transient-error response is NOT a definitive
        miss: it is retried with backoff, and if it still fails after
        RATE_LIMIT_ATTEMPTS, raises instead of silently caching "not
        found" — treating "the service throttled us" as "the address
        does not exist" would misreport real data as unavailable."""
        if query in self.cache:
            return self.cache[query]

        last_status = None
        for attempt in range(RATE_LIMIT_ATTEMPTS):
            elapsed = time.monotonic() - self._last_request
            if elapsed < MIN_INTERVAL_SECONDS:
                time.sleep(MIN_INTERVAL_SECONDS - elapsed)

            try:
                response = httpx.get(
                    NOMINATIM_URL,
                    params={"q": query, "format": "jsonv2", "limit": 1},
                    headers={"User-Agent": USER_AGENT},
                    timeout=15,
                )
            except httpx.HTTPError:
                self._last_request = time.monotonic()
                time.sleep(RATE_LIMIT_BACKOFF_SECONDS * (attempt + 1))
                continue

            self._last_request = time.monotonic()
            if response.status_code == 200:
                matches = response.json()
                result = {"longitude": float(matches[0]["lon"]), "latitude": float(matches[0]["lat"])} if matches else None
                self.cache[query] = result
                return result

            last_status = response.status_code
            if response.status_code in (429, 502, 503, 504):
                retry_after = response.headers.get("retry-after")
                wait = float(retry_after) if retry_after and retry_after.isdigit() else RATE_LIMIT_BACKOFF_SECONDS * (attempt + 1)
                time.sleep(wait)
                continue
            break  # a non-retryable error (e.g. 400) — not a "not found", stop without caching

        raise GeocodingUnavailable(
            f"Nominatim did not give a definitive answer for {query!r} after {RATE_LIMIT_ATTEMPTS} attempts "
            f"(last HTTP status: {last_status}); not caching as 'not found'."
        )

    def save(self) -> None:
        _save_cache(self.cache)
