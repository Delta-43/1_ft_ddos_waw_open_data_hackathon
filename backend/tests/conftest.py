import pytest
from app.services import routing


@pytest.fixture(autouse=True)
def offline_routing(monkeypatch, tmp_path):
    """No test calls OSRM or reads a developer's local cache; tests opt in to fakes."""
    monkeypatch.setattr(routing, "_fetch_live", lambda url: None)
    monkeypatch.setattr(routing, "LOCAL_CACHE", tmp_path / "osrm-cache")
    monkeypatch.setattr(routing, "DEMO_CACHE", tmp_path / "demo-cache")
