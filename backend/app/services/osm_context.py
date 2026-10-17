"""OpenStreetMap context for route scoring: park polygons and major roads.

The committed snapshot (data/fixtures/osm-context.json) is what requests use, so
scoring never calls Overpass. Refresh it with:
    PYTHONPATH=backend python -m app.services.osm_context
"""
import json
from datetime import datetime, timezone
from functools import cache
from pathlib import Path
from typing import Any

import httpx

ROOT = Path(__file__).resolve().parents[3]
SNAPSHOT = ROOT / "data/fixtures/osm-context.json"

# Srodmiescie to Lazienki and Mokotow edge: south,west,north,east
CONTEXT_BBOX = "52.200,21.000,52.240,21.050"
OVERPASS_URLS = ("https://overpass-api.de/api/interpreter", "https://overpass.kumi.systems/api/interpreter")
USER_AGENT = "warsaw2076-hackathon-delta/1.0"
ATTRIBUTION = "© OpenStreetMap contributors, https://www.openstreetmap.org/copyright (ODbL)"
MAJOR_ROADS = ("motorway", "trunk", "primary", "secondary")


def build_query(bbox: str = CONTEXT_BBOX) -> str:
    roads = "|".join(MAJOR_ROADS)
    return f"""
[out:json][timeout:60];
(
  way["leisure"="park"]({bbox});
  relation["leisure"="park"]({bbox});
  way["leisure"="garden"]["name"]({bbox});
  way["highway"~"^({roads})$"]({bbox});
);
out geom tags;
"""


def _ring(geometry: list[dict]) -> list[list[float]]:
    return [[round(p["lon"], 6), round(p["lat"], 6)] for p in geometry]


def join_rings(parts: list[list[list[float]]]) -> list[list[list[float]]]:
    """Join multipolygon member ways that share end points into closed rings."""
    parts = [list(p) for p in parts]
    rings = []
    while parts:
        ring = parts.pop(0)
        while ring[0] != ring[-1]:
            for i, part in enumerate(parts):
                if part[0] == ring[-1]:
                    ring += part[1:]
                elif part[-1] == ring[-1]:
                    ring += part[::-1][1:]
                else:
                    continue
                parts.pop(i)
                break
            else:
                break  # open ring: keep what joined; it still marks the park edge
        rings.append(ring)
    return rings


def normalise(raw: dict[str, Any], source_url: str) -> dict[str, Any]:
    parks, roads = [], []
    for el in raw["elements"]:
        tags = el.get("tags", {})
        osm_id = f"osm:{el['type']}/{el['id']}"
        if "highway" in tags and el["type"] == "way":
            roads.append({"id": osm_id, "highway": tags["highway"], "coordinates": _ring(el["geometry"])})
        elif tags.get("leisure") == "garden" and not tags.get("name"):
            continue  # unnamed flower beds and courtyards
        elif el["type"] == "way" and len(el.get("geometry", [])) >= 4:
            parks.append({"id": osm_id, "name": tags.get("name"), "rings": [_ring(el["geometry"])]})
        elif el["type"] == "relation":
            # Outer members only; enough for "inside or near a park". Holes are ignored.
            rings = join_rings([_ring(m["geometry"]) for m in el.get("members", [])
                                if m.get("role") == "outer" and len(m.get("geometry", [])) >= 2])
            if rings:
                parks.append({"id": osm_id, "name": tags.get("name"), "rings": rings})
    return {
        "source_url": source_url,
        "fetched_at": datetime.now(timezone.utc).astimezone().isoformat(timespec="seconds"),
        "osm_base": raw.get("osm3s", {}).get("timestamp_osm_base"),
        "bbox": CONTEXT_BBOX,
        "licence": "ODbL-1.0",
        "attribution": ATTRIBUTION,
        "parks": parks,
        "roads": roads,
    }


@cache
def load() -> dict[str, Any]:
    return json.loads(SNAPSHOT.read_text(encoding="utf-8"))


def fetch() -> dict[str, Any]:
    error: Exception | None = None
    for url in OVERPASS_URLS:
        try:
            response = httpx.post(url, data={"data": build_query()}, timeout=90,
                                  headers={"User-Agent": USER_AGENT})
            response.raise_for_status()
            return normalise(response.json(), url)
        except httpx.HTTPError as exc:
            error = exc
    raise RuntimeError(f"All Overpass endpoints failed: {error}")


def main(raw_path: str | None = None) -> None:
    if raw_path:  # a saved Overpass response for the same query, when mirrors are overloaded
        data = normalise(json.loads(Path(raw_path).read_text(encoding="utf-8")), OVERPASS_URLS[0])
    else:
        data = fetch()
    SNAPSHOT.write_text(json.dumps(data, ensure_ascii=False, separators=(",", ":")) + "\n",
                        encoding="utf-8")
    print(f"{len(data['parks'])} parks, {len(data['roads'])} roads -> {SNAPSHOT}")


if __name__ == "__main__":
    import sys

    main(sys.argv[1] if len(sys.argv) > 1 else None)
