"""One decision call picks a predefined simulated track; the shared planner runs it."""
import json

from app.adapters import llm
from app.main import app
from app.services import tracks
from fastapi.testclient import TestClient

client = TestClient(app)


class FakeClient:
    def __init__(self, answer):
        self.answer = answer
        self.seen = None

    def complete_json(self, system, user, schema_name, schema):
        self.seen = (user, schema)
        if isinstance(self.answer, Exception):
            raise self.answer
        return self.answer


def use_model(monkeypatch, answer):
    fake = FakeClient(answer)
    monkeypatch.setattr(llm, "get_client", lambda task: fake)
    return fake


def test_every_track_resolves_in_the_catalogue_and_plans():
    listing = client.get("/api/tracks").json()
    assert len(listing["tracks"]) >= 6
    for t in listing["tracks"]:
        body = client.post("/api/tracks/run", json={"query": "x", "track_id": t["id"]})
        assert body.status_code == 200, (t["id"], body.text)
        data = body.json()
        assert data["track"]["id"] == t["id"] and data["track"]["simulated"] is True
        assert data["applied_itinerary"]["destination_place_id"]
        assert data["routes"][0]["places"]


def test_model_picks_track_and_only_sees_ids_and_text(monkeypatch):
    fake = use_model(monkeypatch, {"track_id": "bike-green-loop", "reason": "Wants to cycle."})
    data = client.post("/api/tracks/run", json={"query": "I'd love a bike ride past trees"}).json()
    assert data["track"]["id"] == "bike-green-loop"
    assert data["track"]["picked_by"] == "model"
    assert data["routes"][0]["travel_mode"] == "bike"
    ids = fake.seen[1]["properties"]["track_id"]["enum"]
    assert "bike-green-loop" in ids and len(ids) >= 6
    assert "latitude" not in fake.seen[0]  # no coordinates go to the model


def test_unknown_model_id_or_failure_falls_back_to_keywords(monkeypatch):
    use_model(monkeypatch, {"track_id": "not-a-track", "reason": "?"})
    data = client.post("/api/tracks/run", json={"query": "kind of an astronomy day"}).json()
    assert data["track"]["id"] == "botanical-sky" and data["track"]["picked_by"] == "keywords"
    use_model(monkeypatch, llm.LLMUnavailable("down"))
    data = client.post("/api/tracks/run", json={"query": "Cichy spacer, galeria sztuki"}).json()
    assert data["track"]["id"] == "art-gallery-stroll"


def test_no_keyword_match_uses_the_first_track():
    assert tracks.by_keywords("zzz", tracks.load())["id"] == tracks.load()[0]["id"]


def test_unknown_track_id_is_422_and_extra_fields_rejected():
    assert client.post("/api/tracks/run", json={"query": "x", "track_id": "nope"}).status_code == 422
    assert client.post("/api/tracks/run", json={"query": "x", "user_id": "u1"}).status_code == 422
    assert client.post("/api/tracks/run", json={"query": ""}).status_code == 422


def test_track_run_does_not_call_the_model_for_planning(monkeypatch):
    fake = use_model(monkeypatch, {"track_id": "calm-park-museum", "reason": "ok"})
    client.post("/api/tracks/run", json={"query": "calm"})
    assert json.loads(fake.seen[0])["request"] == "calm"  # one call: the decision only


def test_health_advertises_simulated_tracks():
    assert client.get("/api/health").json()["capabilities"]["simulated_tracks"] is True
