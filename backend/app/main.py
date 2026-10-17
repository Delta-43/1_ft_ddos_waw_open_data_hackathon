"""API starter for contract 1.0. Responses are labelled fixtures, not navigable routes."""
import json
from pathlib import Path
from typing import Annotated

from fastapi import FastAPI, HTTPException, Query

from app.contract import CONTRACT_VERSION, PlaceCategory, RouteRequest

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


@app.get("/api/places")
def places(
    category: PlaceCategory | None = None,
    bbox: Annotated[
        str | None, Query(description="min_lon,min_lat,max_lon,max_lat", max_length=100)
    ] = None,
    limit: Annotated[int, Query(ge=1, le=100)] = 50,
):
    # Fixture-backed until BE-02 replaces it with imported data.
    data = load_fixture("places-response.json")
    items = data["places"]
    if category:
        items = [p for p in items if p["category"] == category]
    if bbox:
        try:
            min_lon, min_lat, max_lon, max_lat = (float(v) for v in bbox.split(","))
        except ValueError:
            raise HTTPException(422, "bbox must be min_lon,min_lat,max_lon,max_lat") from None
        if not (min_lon <= max_lon and min_lat <= max_lat):
            raise HTTPException(422, "bbox minimums must not exceed maximums")
        items = [
            p for p in items
            if min_lon <= p["longitude"] <= max_lon and min_lat <= p["latitude"] <= max_lat
        ]
    data["places"] = items[:limit]
    return data
