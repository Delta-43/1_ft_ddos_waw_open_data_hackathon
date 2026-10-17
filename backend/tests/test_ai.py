import json

import httpx
import pytest
from app.adapters import llm
from app.contract import RouteRequest
from app.services import ai, planner, routing
from test_planner import check_consistent, fake_osrm


class FakeClient:
    name, model = "fake", "fake-model"

    def __init__(self, preferences=None, explain=None, fail=False):
        self.preferences, self.explain, self.fail, self.calls = preferences, explain, fail, []

    def complete_json(self, system, user, schema_name, schema):
        self.calls.append(schema_name)
        if self.fail:
            raise llm.LLMUnavailable("down")
        if schema_name == "preferences":
            return self.preferences
        return {"explanations": self.explain(json.loads(user)["routes"])}


def use(monkeypatch, client):
    monkeypatch.setattr(llm, "get_client", lambda task: client)
    monkeypatch.setattr(routing, "_fetch_live", fake_osrm)


MODEL_PREFS = {"interests": ["art"], "travel_mode": "bike", "max_duration_s": 99999,
               "quiet": 1.7, "green": -1}


def test_model_preferences_are_range_checked(monkeypatch):
    use(monkeypatch, FakeClient(MODEL_PREFS, lambda routes: []))
    prefs = planner.interpret(RouteRequest(query="somewhere calm with art, on two wheels"))
    assert prefs.interpreted_by == "model"
    assert (prefs.travel_mode, prefs.max_duration_s, prefs.quiet, prefs.green) == ("bike", 28800, 1, 0)


def test_explicit_preferences_beat_the_model(monkeypatch):
    use(monkeypatch, FakeClient(MODEL_PREFS, lambda routes: []))
    request = RouteRequest.model_validate({"query": "art", "preferences": {"travel_mode": "walk"}})
    assert planner.interpret(request).travel_mode == "walk"


def test_model_failure_falls_back_to_rules(monkeypatch):
    use(monkeypatch, FakeClient(fail=True))
    data = planner.plan(RouteRequest(query="A quiet, green museum afternoon"))
    check_consistent(data)
    assert data["preferences"]["interpreted_by"] == "rules"
    assert "AI model" not in data["notice"]


def test_grounded_explanations_replace_templates(monkeypatch):
    def explain(routes):
        return [{"route_id": r["route_id"],
                 "text": f"{r['distance_km']} km past {r['museums'][0]['name']}; "
                         f"green estimate {r['green_score']}."} for r in routes]
    use(monkeypatch, FakeClient(MODEL_PREFS, explain))
    data = planner.plan(RouteRequest(query="art by bike"))
    check_consistent(data)
    assert data["preferences"]["interpreted_by"] == "model"
    assert all("green estimate" in r["explanation"] for r in data["routes"])
    assert "AI model" in data["notice"]


def test_invented_numbers_and_unknown_routes_are_rejected(monkeypatch):
    def explain(routes):
        return [{"route_id": r["route_id"], "text": "Only 9.9 km and open until 22:00."}
                for r in routes] + [{"route_id": "made-up", "text": "A secret route."}]
    use(monkeypatch, FakeClient(MODEL_PREFS, explain))
    data = planner.plan(RouteRequest(query="art by bike"))
    assert all(r["explanation"].startswith("Visits ") for r in data["routes"])
    assert "AI model" not in data["notice"]


def test_is_grounded_accepts_copied_numbers_only():
    facts = [{"distance_km": "3.4", "travel_minutes": "44", "green_score": "0.51"}]
    assert ai.is_grounded("3.4 km, about 44 min, green estimate 0.51.", facts)
    assert not ai.is_grounded("3.4 km, about 45 min.", facts)
    assert not ai.is_grounded("   ", facts)


def test_get_client_settings(monkeypatch):
    with pytest.raises(llm.LLMUnavailable):
        llm.get_client("explain")
    monkeypatch.setenv("OPENROUTER_API_KEY", "test-key")
    assert llm.get_client("explain").model == llm.DEFAULT_MODEL
    monkeypatch.setenv("LLM_MODEL", "anthropic/claude-sonnet-5.5")
    monkeypatch.setenv("LLM_MODEL_INTERPRET", "google/gemini-2.5-flash")
    assert llm.get_client("explain").model == "anthropic/claude-sonnet-5.5"
    assert llm.get_client("interpret").model == "google/gemini-2.5-flash"
    monkeypatch.setenv("LLM_PROVIDER", "none")
    with pytest.raises(llm.LLMUnavailable):
        llm.get_client("explain")


def test_openrouter_request_denies_data_collection(monkeypatch):
    sent = {}

    def fake_post(url, json, headers, timeout):
        sent.update(url=url, body=json, headers=headers)
        content = '{"ok": true}'
        return httpx.Response(200, json={"choices": [{"message": {"content": content}}]},
                              request=httpx.Request("POST", url))

    monkeypatch.setattr(httpx, "post", fake_post)
    client = llm.OpenRouterClient("test-key", "anthropic/claude-haiku-5.5", 5)
    assert client.complete_json("sys", "user", "x", {"type": "object"}) == {"ok": True}
    assert sent["body"]["provider"]["data_collection"] == "deny"
    assert sent["body"]["response_format"]["json_schema"]["strict"] is True
    assert sent["headers"]["Authorization"] == "Bearer test-key"


def test_openrouter_errors_become_unavailable(monkeypatch):
    def fake_post(url, json, headers, timeout):
        return httpx.Response(401, request=httpx.Request("POST", url))

    monkeypatch.setattr(httpx, "post", fake_post)
    with pytest.raises(llm.LLMUnavailable):
        llm.OpenRouterClient("bad", "m", 5).complete_json("s", "u", "x", {})
