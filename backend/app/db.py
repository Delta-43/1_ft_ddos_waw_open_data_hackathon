"""SQLite city-data store (city data only: no profiles, preferences or trip history).

One file, data/local/city.db, built from the committed fixtures and, when present,
the fuller gitignored caches in data/local. It is rebuilt on demand, so it is safe
to delete. REST and MCP both read through these functions.

Rebuild:  python -m app.db
"""
import json
import sqlite3
import sys
from datetime import datetime
from pathlib import Path
from typing import Any

from app.data.catalogue import CATEGORY_MAP, OSM_PLACES_SOURCE_ID, _rfc3339, osm_places_source
from app.services import freshness

ROOT = Path(__file__).resolve().parents[2]
DB_PATH = ROOT / "data/local/city.db"
OSM_SAMPLE = ROOT / "data/fixtures/osm-places-sample.json"
OPEN_DATA_SAMPLE = ROOT / "data/fixtures/warsaw-open-data-sample.json"
OPEN_DATA_CACHE = ROOT / "data/local/warsaw_open_data_raw.json"

SCHEMA = """
CREATE TABLE sources (
    id TEXT PRIMARY KEY, name TEXT NOT NULL, mode TEXT NOT NULL, attribution TEXT NOT NULL,
    url TEXT, retrieved_at TEXT, data_date TEXT, method TEXT
);
CREATE TABLE places (
    id TEXT PRIMARY KEY, name TEXT NOT NULL, longitude REAL NOT NULL, latitude REAL NOT NULL,
    category TEXT NOT NULL, summary TEXT, opening_hours TEXT, address TEXT, website TEXT,
    source_id TEXT NOT NULL REFERENCES sources(id)
);
CREATE TABLE features (
    id TEXT PRIMARY KEY, layer TEXT NOT NULL, name TEXT NOT NULL,
    longitude REAL NOT NULL, latitude REAL NOT NULL, properties TEXT NOT NULL,
    source_id TEXT NOT NULL REFERENCES sources(id)
);
CREATE INDEX features_layer ON features(layer);
CREATE INDEX places_category ON places(category);
"""

# layer name -> (dataset key in the open-data files, human label)
LAYERS = {
    "air_quality": ("air_quality", "Air quality stations"),
    "aed": ("aed", "Defibrillators (AED)"),
    "toilets": ("toilets", "Public toilets"),
    "events": ("events", "Cultural events"),
}
_CORE = {"id", "name", "longitude", "latitude", "source", "attribution"}


def build(path: Path = DB_PATH) -> Path:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.unlink(missing_ok=True)
    osm = json.loads(OSM_SAMPLE.read_text(encoding="utf-8"))
    cache = OPEN_DATA_CACHE.exists()
    od = json.loads((OPEN_DATA_CACHE if cache else OPEN_DATA_SAMPLE).read_text(encoding="utf-8"))
    conn = sqlite3.connect(path)
    with conn:
        conn.executescript(SCHEMA)
        _insert_source(conn, osm_places_source())
        conn.executemany(
            "INSERT INTO places VALUES (:id,:name,:longitude,:latitude,:category,NULL,"
            ":opening_hours,NULL,:website,:source_id)",
            [
                {
                    **{k: p[k] for k in ("id", "name", "longitude", "latitude")},
                    "category": CATEGORY_MAP.get(p["category"], "generic"),
                    "opening_hours": p.get("opening_hours"),
                    "website": p.get("website"),
                    "source_id": OSM_PLACES_SOURCE_ID,
                }
                for p in osm["places"]
            ],
        )
        for layer, (key, label) in LAYERS.items():
            dataset = od["datasets"][key]
            source_id = f"warsaw-open-data-{layer}"
            _insert_source(conn, {
                "id": source_id,
                "name": f"Warsaw open data: {label}",
                "mode": "real",  # fetched from dane.um.warszawa.pl; envelope mode is "cached"
                "attribution": od["attribution"],
                "url": f"https://dane.um.warszawa.pl/api/action/{dataset['endpoint']}",
                "retrieved_at": _rfc3339(od["fetched_at"]),
                "data_date": None,
                "method": (
                    f"{dataset['normalised_count']} of {dataset['raw_record_count']} records "
                    "normalised city-wide; "
                    + ("this store holds the full cache." if cache
                       else "this store holds only the committed sample, not the full set.")
                ),
            })
            conn.executemany(
                "INSERT INTO features VALUES (?,?,?,?,?,?,?)",
                [
                    (
                        r["id"], layer, r["name"], r["longitude"], r["latitude"],
                        json.dumps({k: v for k, v in r.items() if k not in _CORE}, ensure_ascii=False),
                        source_id,
                    )
                    for r in dataset["sample_places"]
                ],
            )
    conn.close()
    return path


def _insert_source(conn: sqlite3.Connection, s: dict[str, Any]) -> None:
    conn.execute(
        "INSERT INTO sources VALUES (:id,:name,:mode,:attribution,:url,:retrieved_at,:data_date,:method)",
        {k: s.get(k) for k in ("id", "name", "mode", "attribution", "url", "retrieved_at", "data_date", "method")},
    )


def _open() -> sqlite3.Connection:
    conn = sqlite3.connect(f"file:{DB_PATH}?mode=ro", uri=True, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn


def connect() -> sqlite3.Connection:
    """Read connection; rebuilds the database if it is missing, stale or not a readable SQLite file."""
    inputs = [OSM_SAMPLE, OPEN_DATA_SAMPLE] + ([OPEN_DATA_CACHE] if OPEN_DATA_CACHE.exists() else [])
    if not DB_PATH.exists() or DB_PATH.stat().st_mtime < max(p.stat().st_mtime for p in inputs):
        build()
    try:
        conn = _open()
        conn.execute("SELECT 1 FROM sources LIMIT 1")
    except sqlite3.DatabaseError:  # corrupt or wrong schema: city data is rebuildable from fixtures
        build()
        conn = _open()
    return conn


def _where(bbox: tuple[float, float, float, float] | None, extra: list[tuple[str, Any]]):
    clauses, args = [], []
    for clause, value in extra:
        clauses.append(clause)
        args.append(value)
    if bbox:
        clauses.append("longitude BETWEEN ? AND ? AND latitude BETWEEN ? AND ?")
        args += [bbox[0], bbox[2], bbox[1], bbox[3]]
    return (" WHERE " + " AND ".join(clauses)) if clauses else "", args


def query_places(category: str | None, bbox, limit: int) -> tuple[list[dict], list[dict]]:
    where, args = _where(bbox, [("category = ?", category)] if category else [])
    with connect() as conn:
        rows = conn.execute(f"SELECT * FROM places{where} ORDER BY name LIMIT ?", [*args, limit]).fetchall()
        return [dict(r) for r in rows], _sources(conn, {r["source_id"] for r in rows} or {OSM_PLACES_SOURCE_ID})


def query_layer(layer: str, bbox, limit: int) -> tuple[list[dict], list[dict]]:
    where, args = _where(bbox, [("layer = ?", layer)])
    with connect() as conn:
        rows = conn.execute(f"SELECT * FROM features{where} ORDER BY id LIMIT ?", [*args, limit]).fetchall()
        now = datetime.now(freshness.WARSAW)
        feats = []
        for r in rows:
            props = json.loads(r["properties"])
            if layer == "air_quality":
                # Stations can stop reporting while the feed still answers: judge each reading.
                times = [m.get("time") for m in props.get("measurements", [])]
                latest = max((t for t in times if freshness.parse_time(t)), default=None,
                             key=freshness.parse_time)
                props["freshness"] = freshness.assess(latest, now)
            feats.append({
                "type": "Feature",
                "id": r["id"],
                "geometry": {"type": "Point", "coordinates": [r["longitude"], r["latitude"]]},
                "properties": {"name": r["name"], "layer": layer, "source_id": r["source_id"], **props},
            })
        return feats, _sources(conn, {f"warsaw-open-data-{layer}"})


def layer_counts() -> dict[str, int]:
    with connect() as conn:
        return {r["layer"]: r["n"] for r in conn.execute("SELECT layer, COUNT(*) n FROM features GROUP BY layer")}


def _sources(conn: sqlite3.Connection, ids: set[str]) -> list[dict]:
    marks = ",".join("?" * len(ids))
    return [dict(r) for r in conn.execute(f"SELECT * FROM sources WHERE id IN ({marks}) ORDER BY id", list(ids))]


if __name__ == "__main__":
    print(f"Built {build()}", file=sys.stderr)
    print(layer_counts())
