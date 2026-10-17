"""Fetch and normalise OpenStreetMap places/parks for one demo area.

Real data only: every record keeps its OSM type/id, name and coordinates as
reported by Overpass. Unnamed polygon fragments (for example single flower
beds tagged leisure=garden) are dropped because they are not useful place
cards, not because the source is untrusted.

Run as a script to fetch a fresh sample and print a summary:
    python -m app.data.osm_places
"""
import json
import time
from pathlib import Path
from typing import Any

import httpx

ROOT = Path(__file__).resolve().parents[3]
LOCAL_CACHE = ROOT / "data/local/osm_places_raw.json"

# Lazienki / Ujazdow demo area, Warsaw: south,west,north,east
DEMO_BBOX = "52.2060,21.0220,52.2250,21.0480"

OVERPASS_ENDPOINTS = [
    "https://overpass-api.de/api/interpreter",
    "https://overpass.kumi.systems/api/interpreter",
]

USER_AGENT = "warsaw2076-hackathon-sonia/1.0 (contact: ms9600927@gmail.com)"

ATTRIBUTION = "© OpenStreetMap contributors, https://www.openstreetmap.org/copyright (ODbL)"


def build_query(bbox: str = DEMO_BBOX) -> str:
    return f"""
[out:json][timeout:25];
(
  way["leisure"="park"]({bbox});
  way["leisure"="garden"]({bbox});
  node["tourism"="museum"]({bbox});
  way["tourism"="museum"]({bbox});
  node["tourism"="gallery"]({bbox});
  node["historic"]({bbox});
  way["historic"]({bbox});
);
out center tags;
"""


# historic=* in this demo area is mostly two things: ~90 individual
# commemorative plaques/statues (historic=memorial) and ~45 buildings
# tagged just historic=yes (ambiguous - could be anything). Neither is a
# place worth a card on a museum/park outing. Kept values are actual
# visitable buildings/sites. This mirrors dropping unnamed gardens in
# DATA-01: a documented usefulness filter, not distrust of the source.
HISTORIC_VALUES_KEPT = {"castle", "church", "manor", "building", "ruins", "monument", "archaeological_site"}


def fetch_overpass(bbox: str = DEMO_BBOX, attempts_per_endpoint: int = 2) -> dict[str, Any]:
    """Bounded retries across two Overpass mirrors. Raises on total failure."""
    query = build_query(bbox)
    headers = {"User-Agent": USER_AGENT}
    last_error: Exception | None = None
    for url in OVERPASS_ENDPOINTS:
        for _ in range(attempts_per_endpoint):
            try:
                response = httpx.post(url, data={"data": query}, timeout=45, headers=headers)
            except httpx.HTTPError as exc:
                last_error = exc
                time.sleep(5)
                continue
            if response.status_code == 200:
                return {
                    "source_url": url,
                    "fetched_at": time.strftime("%Y-%m-%dT%H:%M:%S%z"),
                    "bbox": bbox,
                    "elements": response.json().get("elements", []),
                }
            last_error = RuntimeError(f"{url} returned HTTP {response.status_code}")
            time.sleep(5)
    raise RuntimeError(f"Overpass fetch failed on all endpoints: {last_error}")


def _category(tags: dict[str, str]) -> str:
    return tags.get("tourism") or tags.get("leisure") or tags.get("historic") or "unknown"


def normalise(elements: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """Keep only named elements; preserve OSM id, name, coordinates and known tags.

    historic=memorial and historic=yes are dropped unless the element also
    carries a tourism/leisure tag that already qualifies it - see
    HISTORIC_VALUES_KEPT above."""
    places = []
    for element in elements:
        tags = element.get("tags", {})
        name = tags.get("name")
        if not name:
            continue
        category = _category(tags)
        if "historic" in tags and not (tags.get("tourism") or tags.get("leisure")):
            if tags["historic"] not in HISTORIC_VALUES_KEPT:
                continue
        if element["type"] == "node":
            lon, lat = element.get("lon"), element.get("lat")
        else:
            center = element.get("center", {})
            lon, lat = center.get("lon"), center.get("lat")
        if lon is None or lat is None:
            continue
        places.append(
            {
                "id": f"osm:{element['type']}/{element['id']}",
                "name": name,
                "longitude": lon,
                "latitude": lat,
                "category": category,
                "opening_hours": tags.get("opening_hours"),
                "website": tags.get("website"),
                "source": "osm",
                "attribution": ATTRIBUTION,
            }
        )
    return places


def fetch_and_normalise(bbox: str = DEMO_BBOX) -> dict[str, Any]:
    raw = fetch_overpass(bbox)
    places = normalise(raw["elements"])
    return {
        "source_url": raw["source_url"],
        "fetched_at": raw["fetched_at"],
        "bbox": raw["bbox"],
        "licence": "ODbL",
        "attribution": ATTRIBUTION,
        "raw_record_count": len(raw["elements"]),
        "named_place_count": len(places),
        "places": places,
    }


if __name__ == "__main__":
    result = fetch_and_normalise()
    LOCAL_CACHE.parent.mkdir(parents=True, exist_ok=True)
    LOCAL_CACHE.write_text(json.dumps(result, indent=2, ensure_ascii=False))
    print(f"Fetched {result['raw_record_count']} raw elements, {result['named_place_count']} named places")
    print(f"Source: {result['source_url']} at {result['fetched_at']}")
    print(f"Cached to {LOCAL_CACHE}")
