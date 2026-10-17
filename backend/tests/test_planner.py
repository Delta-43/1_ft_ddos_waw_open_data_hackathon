import json
from pathlib import Path

from app.contract import RouteRequest
from app.services import osm_context, planner, routing, scoring
from jsonschema import Draft202012Validator, FormatChecker

ROOT = Path(__file__).resolve().parents[2]
SCHEMA = json.loads((ROOT / "contracts/api.schema.json").read_text(encoding="utf-8"))
RESPONSE = Draft202012Validator(
    {"$ref": "#/$defs/RouteResponse", "$defs": SCHEMA["$defs"]}, format_checker=FormatChecker()
)
LAZIENKI_PALACE = (21.0358, 52.2151)
CENTRUM = (21.0122, 52.2297)


def fake_osrm(url: str) -> dict:
    """Straight segments between the requested waypoints, shaped like a cached OSRM reply."""
    path = url.split("/route/v1/")[1].split("/", 1)[1].split("?")[0]
    coords = [[float(v) for v in pair.split(",")] for pair in path.split(";")]
    legs = [scoring.line_length_m([a, b]) for a, b in zip(coords, coords[1:])]
    return {"geometry": {"coordinates": coords}, "distance": sum(legs), "duration": sum(legs) / 1.3,
            "legs": [{"distance": d, "duration": d / 1.3} for d in legs]}


def check_consistent(data: dict) -> None:
    RESPONSE.validate(data)
    source_ids = {s["id"] for s in data["sources"]}
    assert sum(r["recommended"] for r in data["routes"]) == 1
    assert [r["rank"] for r in data["routes"]] == list(range(1, len(data["routes"]) + 1))
    for route in data["routes"]:
        assert {s["place_id"] for s in route["stops"]} == {p["id"] for p in route["places"]}
        assert route["geometry_source_id"] in source_ids
        assert {m["source_id"] for m in route["metrics"].values()} <= source_ids


def test_snapshot_park_rings_are_closed():
    parks = osm_context.load()["parks"]
    lazienki = next(p for p in parks if p["name"] == "Łazienki Królewskie")
    assert all(ring[0] == ring[-1] for ring in lazienki["rings"])


def test_join_rings_joins_reversed_parts():
    parts = [[[0, 0], [1, 0]], [[1, 1], [1, 0]], [[1, 1], [0, 0]]]
    assert osm_context.join_rings(parts) == [[[0, 0], [1, 0], [1, 1], [0, 0]]]


def test_green_and_quiet_proxies():
    assert scoring.is_green(scoring.project(*LAZIENKI_PALACE))
    assert not scoring.is_green(scoring.project(*CENTRUM))
    # Marszalkowska at Centrum is a primary road; the palace is far from major roads.
    assert scoring.quietness(scoring.project(*CENTRUM)) < 0.3
    assert scoring.quietness(scoring.project(*LAZIENKI_PALACE)) == 1


def test_interpret_rules_and_explicit_preferences_win():
    prefs = planner.interpret(RouteRequest(query="Quiet art by bike for 2 hours"))
    assert (prefs.travel_mode, prefs.max_duration_s, prefs.quiet, prefs.green) == ("bike", 7200, 0.8, 0.3)
    assert prefs.interests == ["art"]
    explicit = RouteRequest.model_validate(
        {"query": "quiet art by bike", "preferences": {"travel_mode": "walk", "priorities": {"quiet": 0.1}}}
    )
    assert planner.interpret(explicit).travel_mode == "walk"
    assert planner.interpret(explicit).quiet == 0.1


def test_street_routes_rank_green_quiet_first(monkeypatch):
    monkeypatch.setattr(routing, "_fetch_live", fake_osrm)
    data = planner.plan(RouteRequest(query="A quiet, green museum afternoon"))
    check_consistent(data)
    assert data["mode"] == "live"
    assert all(r["geometry_kind"] == "street" for r in data["routes"])
    best = data["routes"][0]["metrics"]
    direct = next(r for r in data["routes"] if r["id"] == "direct")["metrics"]
    assert best["green_score"]["value"] >= direct["green_score"]["value"]
    assert {p["source_id"] for r in data["routes"] for p in r["places"]} == {"osm-places"}


def test_closed_museums_are_never_suggested(monkeypatch):
    monkeypatch.setattr(routing, "_fetch_live", fake_osrm)
    data = planner.plan(RouteRequest(query="museums", preferences={"max_duration_s": 28800}))
    names = {p["name"] for r in data["routes"] for p in r["places"]}
    assert not any("remont" in n for n in names)


def test_cached_route_is_labelled(monkeypatch):
    def cache_only(url):
        return fake_osrm(url)
    monkeypatch.setattr(routing, "_read_cache", cache_only)
    data = planner.plan(RouteRequest(query="green museums"))
    check_consistent(data)
    assert data["mode"] == "cached"
    assert "cached" in data["notice"]


def test_routing_outage_falls_back_to_labelled_straight_lines():
    data = planner.plan(RouteRequest(query="green museums", preferences={"travel_mode": "bike"}))
    check_consistent(data)
    assert data["mode"] == "mock"
    assert all(r["geometry_kind"] == "straight_line" for r in data["routes"])
    assert any(s["id"] == "straight-line" and s["mode"] == "simulated" for s in data["sources"])
    assert "not street directions" in data["notice"]
