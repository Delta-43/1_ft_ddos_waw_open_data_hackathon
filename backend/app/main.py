"""API starter for contract 1.0. Responses are labelled fixtures, not navigable routes."""
import json
from pathlib import Path
from typing import Annotated, Literal

from fastapi import FastAPI, HTTPException, Query

from app import db
from app.contract import CONTRACT_VERSION, PlaceCategory, RouteRequest
from app.data.catalogue import places_response as load_places_response

ROOT = Path(__file__).resolve().parents[2]
FIXTURES = ROOT / "data/fixtures"
app = FastAPI(title="Warsaw 2076")


def load_fixture(name: str) -> dict:
    return json.loads((FIXTURES / name).read_text(encoding="utf-8"))


@app.get("/api/health")
def health():
    return {"status": "ok", "mode": "fixture", "contract_version": CONTRACT_VERSION}


@app.post("/api/routes")
def routes(request: RouteRequest):
    # Replace with shared services (BE-01); MCP must call those same services.
    # The request is not stored or logged.
    return load_fixture("route-response.json")


def parse_bbox(bbox: str | None) -> tuple[float, float, float, float] | None:
    if not bbox:
        return None
    try:
        min_lon, min_lat, max_lon, max_lat = (float(v) for v in bbox.split(","))
    except ValueError:
        raise HTTPException(422, "bbox must be min_lon,min_lat,max_lon,max_lat") from None
    if not (min_lon <= max_lon and min_lat <= max_lat):
        raise HTTPException(422, "bbox minimums must not exceed maximums")
    return min_lon, min_lat, max_lon, max_lat


BBox = Annotated[
    str | None, Query(description="min_lon,min_lat,max_lon,max_lat", max_length=100)
]


@app.get("/api/places")
def places(
    category: PlaceCategory | None = None,
    bbox: BBox = None,
    limit: Annotated[int, Query(ge=1, le=100)] = 50,
):
    data = load_places_response()  # envelope: mode, notice, generated_at
    data["places"], data["sources"] = db.query_places(category, parse_bbox(bbox), limit)
    return data


@app.get("/api/layers")
def layers():
    """Open-data layers available as GeoJSON, with feature counts held in the store."""
    counts = db.layer_counts()
    return {"layers": [
        {"id": k, "label": label, "count": counts.get(k, 0), "url": f"/api/layers/{k}"}
        for k, (_, label) in db.LAYERS.items()
    ]}


@app.get("/api/layers/{layer}")
def layer(
    layer: Literal["air_quality", "aed", "toilets", "events"],
    bbox: BBox = None,
    limit: Annotated[int, Query(ge=1, le=500)] = 200,
):
    """GeoJSON FeatureCollection (lon,lat) for MapLibre; `sources` carries attribution."""
    features, sources = db.query_layer(layer, parse_bbox(bbox), limit)
    return {
        "type": "FeatureCollection",
        "contract_version": CONTRACT_VERSION,
        "mode": "cached",
        "features": features,
        "sources": sources,
    }
