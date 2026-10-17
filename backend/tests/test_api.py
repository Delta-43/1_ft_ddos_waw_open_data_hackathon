import json
from pathlib import Path

from app.main import app
from fastapi.testclient import TestClient
from jsonschema import validate

ROOT = Path(__file__).resolve().parents[2]
client = TestClient(app)


def test_route_response_matches_contract():
    response = client.post("/api/routes", json={"query": "A quiet museum outing"})
    assert response.status_code == 200
    validate(response.json(), json.loads((ROOT / "contracts/route.schema.json").read_text()))


def test_empty_query_is_rejected():
    assert client.post("/api/routes", json={"query": ""}).status_code == 422
