"""Street geometry from the FOSSGIS OSRM servers (OpenStreetMap data), with caches.

Lookup order is set by ROUTING_SOURCE:
- "live" (default): live request, then a cached copy if the service fails.
- "cache": a cached copy first, then live. Use this for the pitch.
Successful live responses are written to data/local/osrm-cache (not committed).
data/fixtures/osrm-cache holds committed responses for the demo prompts.
If nothing works, the caller falls back to straight lines and must label them.
"""
import hashlib
import json
import logging
import os
from dataclasses import dataclass
from pathlib import Path

import httpx

ROOT = Path(__file__).resolve().parents[3]
LOCAL_CACHE = ROOT / "data/local/osrm-cache"
DEMO_CACHE = ROOT / "data/fixtures/osrm-cache"
PROFILES = {"walk": ("routed-foot", "foot"), "bike": ("routed-bike", "bike")}
BASE_URL = "https://routing.openstreetmap.de"
TIMEOUT_S = 8
USER_AGENT = "warsaw2076-hackathon-delta/1.0"
ATTRIBUTION = (
    "Routing: FOSSGIS OSRM, routing.openstreetmap.de. "
    "Map data © OpenStreetMap contributors (ODbL)"
)
log = logging.getLogger(__name__)


class RoutingUnavailable(Exception):
    pass


@dataclass
class StreetRoute:
    coordinates: list[list[float]]
    distance_m: float
    duration_s: float
    leg_durations_s: list[float]
    origin: str  # "live" or "cached"


def route_url(mode: str, waypoints: list[tuple[float, float]]) -> str:
    server, profile = PROFILES[mode]
    path = ";".join(f"{lon:.6f},{lat:.6f}" for lon, lat in waypoints)
    return f"{BASE_URL}/{server}/route/v1/{profile}/{path}?overview=full&geometries=geojson"


def _cache_name(url: str) -> str:
    return hashlib.sha1(url.encode()).hexdigest()[:16] + ".json"


def _read_cache(url: str) -> dict | None:
    for folder in (LOCAL_CACHE, DEMO_CACHE):
        path = folder / _cache_name(url)
        if path.exists():
            return json.loads(path.read_text(encoding="utf-8"))
    return None


def _fetch_live(url: str) -> dict | None:
    try:
        response = httpx.get(url, timeout=TIMEOUT_S, headers={"User-Agent": USER_AGENT})
        response.raise_for_status()
        data = response.json()
    except (httpx.HTTPError, ValueError) as exc:
        log.warning("OSRM request failed: %s", exc)
        return None
    if data.get("code") != "Ok" or not data.get("routes"):
        return None
    route = data["routes"][0]
    slim = {
        "url": url,
        "geometry": route["geometry"],
        "distance": route["distance"],
        "duration": route["duration"],
        "legs": [{"distance": leg["distance"], "duration": leg["duration"]} for leg in route["legs"]],
    }
    LOCAL_CACHE.mkdir(parents=True, exist_ok=True)
    (LOCAL_CACHE / _cache_name(url)).write_text(json.dumps(slim), encoding="utf-8")
    return slim


def street_route(mode: str, waypoints: list[tuple[float, float]]) -> StreetRoute:
    url = route_url(mode, waypoints)
    order = ["cache", "live"] if os.environ.get("ROUTING_SOURCE") == "cache" else ["live", "cache"]
    for step in order:
        data = _fetch_live(url) if step == "live" else _read_cache(url)
        if data:
            return StreetRoute(
                coordinates=data["geometry"]["coordinates"],
                distance_m=data["distance"],
                duration_s=data["duration"],
                leg_durations_s=[leg["duration"] for leg in data["legs"]],
                origin=step if step == "live" else "cached",
            )
    raise RoutingUnavailable(url)
