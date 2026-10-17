"""DATA-10: contract stability under provider/cache failure.

OSRM routing outages are already covered thoroughly in test_planner.py
(test_routing_outage_falls_back_to_labelled_straight_lines) via the
autouse offline_routing fixture in conftest.py, which makes "OSRM is
down" the default test condition. Nothing duplicated here.

/api/places and /api/layers never call a live external provider at
request time - they read app.db's SQLite store, which is built from
committed fixtures (plus an optional gitignored full cache). So the
"provider failure" surface for those two endpoints is local-cache
resilience: can the demo survive its own cache being missing or
damaged right before the pitch?

Every test here runs against an isolated tmp_path database, never the
real data/local/city.db. db.build()'s `path: Path = DB_PATH` default
argument is captured once at function-definition time, so merely
monkeypatching the module-level db.DB_PATH does not redirect
connect()'s zero-argument call to build() - the autouse fixture below
also rewrites build()'s captured default via __defaults__ to cover
that.
"""
import json
from pathlib import Path

import pytest
from app import db
from app.main import app
from fastapi.testclient import TestClient
from jsonschema import Draft202012Validator, FormatChecker

ROOT = Path(__file__).resolve().parents[2]
SCHEMA = json.loads((ROOT / "contracts/api.schema.json").read_text(encoding="utf-8"))
client = TestClient(app)


def validator(name: str) -> Draft202012Validator:
    return Draft202012Validator({"$ref": f"#/$defs/{name}", "$defs": SCHEMA["$defs"]}, format_checker=FormatChecker())


@pytest.fixture(autouse=True)
def _isolated_db(monkeypatch, tmp_path):
    """Redirect every test in this file to a throwaway city.db, so running
    this suite never touches, corrupts or deletes the real
    data/local/city.db a live demo server might be reading."""
    path = tmp_path / "city.db"
    monkeypatch.setattr(db, "DB_PATH", path)
    monkeypatch.setattr(db.build, "__defaults__", (path,))
    return path


def test_places_endpoint_rebuilds_a_missing_db(_isolated_db):
    """A missing city.db (gitignored, and db.py's own docstring says it is
    "safe to delete") must not break the demo - the next request should
    transparently rebuild it from the committed fixtures."""
    assert not _isolated_db.exists()

    response = client.get("/api/places", params={"category": "museum"})

    assert response.status_code == 200
    data = response.json()
    validator("PlacesResponse").validate(data)
    assert data["places"]
    assert _isolated_db.exists()  # rebuilt


def test_layers_endpoint_rebuilds_a_missing_db():
    response = client.get("/api/layers")

    assert response.status_code == 200
    index = response.json()["layers"]
    assert all(layer["count"] > 0 for layer in index)


def test_db_build_falls_back_to_committed_sample_when_full_cache_is_absent(monkeypatch, tmp_path):
    """data/local/warsaw_open_data_raw.json (the full, gitignored cache) is
    exactly the kind of file that won't exist on a teammate's machine, or
    that might get deleted mid-demo. The build must still succeed, using
    the committed 8-record sample instead, and must say so honestly in the
    source's method text - not silently pretend it has the full dataset."""
    monkeypatch.setattr(db, "OPEN_DATA_CACHE", tmp_path / "does-not-exist.json")

    response = client.get("/api/layers/aed")

    assert response.status_code == 200
    body = response.json()
    assert len(body["features"]) == 8  # the committed sample size, not the full 710
    method = body["sources"][0]["method"]
    assert "committed sample, not the full set" in method


@pytest.mark.xfail(
    reason=(
        "Known gap, not fixed here: app.db.connect() only checks city.db's mtime "
        "against its input fixtures, never that the file is actually a readable "
        "SQLite database. A corrupted-but-newer city.db raises sqlite3.DatabaseError "
        "('file is not a database'), which main.py does not catch, producing an "
        "unhandled 500 instead of a graceful rebuild. db.py is Delta's file "
        "(backend/app/, not backend/tests/), so this is flagged, not fixed, here - "
        "see #56 for the fix."
    ),
    strict=True,
)
def test_corrupted_db_does_not_crash_the_places_endpoint(_isolated_db):
    _isolated_db.write_text("not actually a sqlite database")

    response = client.get("/api/places")

    assert response.status_code == 200
