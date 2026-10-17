"""Serves /api/places from the real OSM sample (DATA-01 + DATA-05), not a
fixture.

Reads the committed data/fixtures/osm-places-sample.json (75 named places,
Łazienki/Ujazdów demo area: museums/parks/gardens/galleries from DATA-01,
plus historic buildings/castles/churches/ruins from DATA-05) and maps it
to contracts/api.schema.json's Place and PlacesResponse shapes.
mode="cached": this is a real fetch result stored at event time, not a
live per-request call and not an invented mock.

Category mapping is intentionally narrow to the contract's PlaceCategory
enum (museum, landmark, park, generic — "matches the frontend pin icons").
- OSM "garden" -> "park" (a named garden is green space, same as a park
  for this app).
- OSM "castle"/"church"/"manor"/"ruins"/"building" (historic=*, DATA-05)
  -> "landmark". Note "building" is a broad OSM value — most are genuine
  Łazienki-complex structures (the old Orangery, the Observatory), but a
  couple are mundane (e.g. a hospital ward building that happens to sit
  on historic ground). Not hand-curated further; see docs/DATA.md.
- OSM "gallery"/"artwork"/"attraction"/"information" -> "generic" rather
  than stretched into "museum" or "landmark" without the contract owners
  (Delta+Alban) agreeing to a wider enum.
"""
import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[3]
OSM_SAMPLE_PATH = ROOT / "data/fixtures/osm-places-sample.json"

CATEGORY_MAP = {
    "museum": "museum",
    "park": "park",
    "garden": "park",
    "castle": "landmark",
    "church": "landmark",
    "manor": "landmark",
    "ruins": "landmark",
    "building": "landmark",
    "gallery": "generic",
    "artwork": "generic",
    "attraction": "generic",
    "information": "generic",
}

OSM_PLACES_SOURCE_ID = "osm-places-demo"


def _rfc3339(timestamp: str) -> str:
    """The contract's Timestamp pattern requires a colon in the UTC offset
    (e.g. +02:00); the committed sample was written with strftime's %z,
    which omits it (+0200). Reparse and reformat rather than editing the
    stored fixture, since the fixture itself is also DATA-01's raw
    evidence record."""
    return datetime.strptime(timestamp, "%Y-%m-%dT%H:%M:%S%z").isoformat()


def _now_rfc3339() -> str:
    return datetime.now(timezone.utc).astimezone().isoformat(timespec="seconds")


def _map_category(osm_category: str) -> str:
    return CATEGORY_MAP.get(osm_category, "generic")


def _to_contract_place(osm_place: dict[str, Any]) -> dict[str, Any]:
    return {
        "id": osm_place["id"],
        "name": osm_place["name"],
        "longitude": osm_place["longitude"],
        "latitude": osm_place["latitude"],
        "category": _map_category(osm_place["category"]),
        "summary": None,
        "opening_hours": osm_place.get("opening_hours"),
        "address": None,  # not captured by the OSM query this sample used
        "website": osm_place.get("website"),
        "source_id": OSM_PLACES_SOURCE_ID,
    }


def _load_osm_sample() -> dict[str, Any]:
    return json.loads(OSM_SAMPLE_PATH.read_text(encoding="utf-8"))


def load_places() -> list[dict[str, Any]]:
    """All known places, mapped to the contract's Place shape."""
    sample = _load_osm_sample()
    return [_to_contract_place(p) for p in sample["places"]]


def osm_places_source() -> dict[str, Any]:
    sample = _load_osm_sample()
    return {
        "id": OSM_PLACES_SOURCE_ID,
        "name": "OpenStreetMap places (Łazienki/Ujazdów demo area)",
        "mode": "real",
        "attribution": sample["attribution"],
        "url": sample["source_url"],
        "retrieved_at": _rfc3339(sample["fetched_at"]),
        "data_date": None,
        "method": (
            f"Overpass query over bbox {sample['bbox']} (south,west,north,east); "
            f"{sample['raw_record_count']} raw elements, kept only the "
            f"{sample['named_place_count']} with a name."
        ),
    }


def places_response() -> dict[str, Any]:
    return {
        "contract_version": "1.0",
        "mode": "cached",
        "notice": "Cached real OpenStreetMap sample for one small demo area; not a live feed and not citywide coverage.",
        "generated_at": _now_rfc3339(),
        "places": load_places(),
        "sources": [osm_places_source()],
    }
