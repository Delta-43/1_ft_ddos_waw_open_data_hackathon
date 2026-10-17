import json
from pathlib import Path

import pytest
from app.main import app
from fastapi.testclient import TestClient
from jsonschema import Draft202012Validator, FormatChecker

ROOT = Path(__file__).resolve().parents[2]
SCHEMA = json.loads((ROOT / "contracts/api.schema.json").read_text(encoding="utf-8"))
client = TestClient(app)


def validator(name: str) -> Draft202012Validator:
    schema = {"$ref": f"#/$defs/{name}", "$defs": SCHEMA["$defs"]}
    return Draft202012Validator(schema, format_checker=FormatChecker())


def fixture(name: str) -> dict:
    return json.loads((ROOT / "data/fixtures" / name).read_text(encoding="utf-8"))


def test_schema_is_valid():
    Draft202012Validator.check_schema(SCHEMA)


@pytest.mark.parametrize(
    ("name", "definition"),
    [("route-response.json", "RouteResponse"), ("places-response.json", "PlacesResponse")],
)
def test_fixtures_match_contract(name, definition):
    validator(definition).validate(fixture(name))


def test_route_fixture_is_consistent():
    data = fixture("route-response.json")
    source_ids = {s["id"] for s in data["sources"]}
    assert sum(r["recommended"] for r in data["routes"]) == 1
    for route in data["routes"]:
        place_ids = {p["id"] for p in route["places"]}
        assert {s["place_id"] for s in route["stops"]} == place_ids
        assert route["geometry_source_id"] in source_ids
        assert {m["source_id"] for m in route["metrics"].values()} <= source_ids
        assert {p["source_id"] for p in route["places"]} <= source_ids


def test_route_response_matches_contract():
    body = {
        "query": "A quiet museum outing",
        "preferences": {
            "interests": ["museums"],
            "travel_mode": "walk",
            "max_duration_s": 10800,
            "priorities": {"quiet": 0.8, "green": 0.8},
            "start": {"longitude": 21.0122, "latitude": 52.2297},
        },
    }
    response = client.post("/api/routes", json=body)
    assert response.status_code == 200
    validator("RouteResponse").validate(response.json())


@pytest.mark.parametrize(
    "body",
    [
        {"query": ""},
        {"query": "x" * 1001},
        {"query": "ok", "user_id": "abc"},
        {"query": "ok", "preferences": {"travel_mode": "car"}},
        {"query": "ok", "preferences": {"priorities": {"green": 2}}},
        {"query": "ok", "preferences": {"start": {"longitude": 200, "latitude": 52}}},
    ],
)
def test_invalid_route_requests_are_rejected(body):
    assert client.post("/api/routes", json=body).status_code == 422


def test_places_match_contract_and_filter():
    response = client.get("/api/places", params={"category": "museum", "limit": 2})
    assert response.status_code == 200
    data = response.json()
    validator("PlacesResponse").validate(data)
    assert len(data["places"]) == 2
    assert all(p["category"] == "museum" for p in data["places"])


def test_places_bbox_filter():
    # Must overlap the real OSM demo-area sample (DATA-01), which covers
    # roughly lon 21.022-21.046, lat 52.207-52.225 - see docs/DATA.md.
    bbox = "21.02,52.21,21.03,52.22"
    data = client.get("/api/places", params={"bbox": bbox}).json()
    assert data["places"]
    assert all(21.02 <= p["longitude"] <= 21.03 for p in data["places"])
    assert all(52.21 <= p["latitude"] <= 52.22 for p in data["places"])


@pytest.mark.parametrize(
    "params", [{"category": "pub"}, {"limit": 0}, {"limit": 101}, {"bbox": "1,2,3"}]
)
def test_invalid_places_requests_are_rejected(params):
    assert client.get("/api/places", params=params).status_code == 422


def test_places_served_from_db_match_contract():
    data = client.get("/api/places", params={"category": "museum"}).json()
    validator("PlacesResponse").validate(data)
    assert data["places"] and all(p["category"] == "museum" for p in data["places"])
    assert {s["id"] for s in data["sources"]} == {p["source_id"] for p in data["places"]}


def test_layers_index_and_geojson():
    index = client.get("/api/layers").json()["layers"]
    assert {layer["id"] for layer in index} == {"air_quality", "aed", "toilets", "events"}
    assert all(layer["count"] > 0 for layer in index)
    body = client.get("/api/layers/aed", params={"limit": 3}).json()
    assert body["type"] == "FeatureCollection" and len(body["features"]) == 3
    lon, lat = body["features"][0]["geometry"]["coordinates"]
    assert 20 < lon < 22 and 51 < lat < 53  # longitude first
    assert body["sources"][0]["attribution"]


def test_layer_bbox_and_validation():
    assert client.get("/api/layers/nope").status_code == 422
    assert client.get("/api/layers/aed", params={"bbox": "0,0,1,1"}).json()["features"] == []
    assert client.get("/api/layers/aed", params={"bbox": "1,0,0,1"}).status_code == 422


def test_air_quality_features_carry_freshness():
    features = client.get("/api/layers/air_quality").json()["features"]
    for feature in features:
        fresh = feature["properties"]["freshness"]
        assert set(fresh) == {"updated_at", "age_s", "fresh", "reason"}
        assert fresh["fresh"] is (fresh["reason"] is None)
def test_layer_source_modes_are_valid_source_modes():
    modes = set(SCHEMA["$defs"]["SourceMode"]["enum"])
    for layer in ("air_quality", "aed", "toilets", "events"):
        for source in client.get(f"/api/layers/{layer}").json()["sources"]:
            assert source["mode"] in modes
