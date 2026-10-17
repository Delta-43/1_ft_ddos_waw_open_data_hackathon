import json

import pytest
from app.adapters.mcp_server import build_app
from fastapi.testclient import TestClient

TOKEN = "test-token"
HEADERS = {
    "Authorization": f"Bearer {TOKEN}",
    "Accept": "application/json, text/event-stream",
    "Content-Type": "application/json",
}


@pytest.fixture
def client():
    with TestClient(build_app(TOKEN)) as c:
        yield c


def rpc(client, method, params=None, headers=HEADERS):
    body = {"jsonrpc": "2.0", "id": 1, "method": method, "params": params or {}}
    return client.post("/mcp", content=json.dumps(body), headers=headers)


def call(client, name, arguments):
    response = rpc(client, "tools/call", {"name": name, "arguments": arguments})
    assert response.status_code == 200
    result = response.json()["result"]
    if not result.get("isError"):
        result["data"] = json.loads(result["content"][0]["text"])
    return result


def test_refuses_to_start_without_token():
    with pytest.raises(RuntimeError):
        build_app("")


@pytest.mark.parametrize("auth", [None, "Bearer wrong"])
def test_rejects_missing_or_wrong_token(client, auth):
    headers = {k: v for k, v in HEADERS.items() if k != "Authorization"}
    if auth:
        headers["Authorization"] = auth
    assert rpc(client, "tools/list", headers=headers).status_code == 401


def test_lists_tools(client):
    tools = rpc(client, "tools/list").json()["result"]["tools"]
    assert {t["name"] for t in tools} == {"plan_outing", "search_places", "list_layers", "get_layer"}


def test_plan_outing_uses_the_shared_planner(client):
    result = call(client, "plan_outing", {"query": "A quiet museum outing", "travel_mode": "walk"})
    assert not result.get("isError")
    data = result["data"]
    assert data["routes"] and data["sources"]
    assert data["routes"][0]["geometry"]["type"] == "LineString"


def test_plan_outing_invalid_input_is_a_tool_error(client):
    result = call(client, "plan_outing", {"query": "x", "max_duration_s": 5})
    assert result["isError"] is True


def test_places_and_layers(client):
    places = call(client, "search_places", {"category": "museum", "limit": 3})["data"]
    assert 0 < len(places["places"]) <= 3 and places["sources"]
    layers = call(client, "list_layers", {})["data"]["layers"]
    assert {layer["id"] for layer in layers} == {"air_quality", "aed", "toilets", "events"}
    aed = call(client, "get_layer", {"layer": "aed", "limit": 2})["data"]
    assert aed["type"] == "FeatureCollection" and len(aed["features"]) == 2
