import pytest
from app.services import routing


@pytest.fixture(autouse=True)
def offline_routing(monkeypatch, tmp_path):
    """No test calls OSRM or reads a developer's local cache; tests opt in to fakes."""
    monkeypatch.setattr(routing, "_fetch_live", lambda url: None)
    monkeypatch.setattr(routing, "LOCAL_CACHE", tmp_path / "osrm-cache")
    monkeypatch.setattr(routing, "DEMO_CACHE", tmp_path / "demo-cache")


@pytest.fixture(autouse=True)
def no_model(monkeypatch):
    """No test calls a real model, even if a developer's .env has a key."""
    for var in ("LLM_PROVIDER", "OPENROUTER_API_KEY", "LLM_MODEL"):
        monkeypatch.delenv(var, raising=False)


@pytest.fixture(autouse=True)
def fixed_clock(monkeypatch):
    """Planning depends on opening hours, so tests run at a fixed Sunday noon in Warsaw."""
    from datetime import datetime

    from app.services import planner

    monkeypatch.setattr(planner, "clock", lambda: datetime(2026, 10, 18, 12, 0, tzinfo=planner.WARSAW))
