"""Snapshot the backend's contract-1.0 responses into frontend/public/demo/ for the static GitHub Pages demo.

Runs the same services the API uses (no HTTP, no model call: every track is forced by id) and writes
JSON the demo build serves instead of /api. Re-run after fixtures change:

    PYTHONPATH=backend .venv/bin/python scripts/build_demo_fixtures.py
"""
import json
from pathlib import Path

from app import db
from app.data.catalogue import places_response
from app.services import tracks

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "frontend/public/demo"
# Central Warsaw: where the committed data and the bundled map tiles are.
BBOX = (20.90, 52.14, 21.12, 52.30)


def dump(path: Path, data: object) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, ensure_ascii=False, separators=(",", ":")) + "\n", encoding="utf-8")
    print(f"{path.relative_to(ROOT)}  {path.stat().st_size / 1024:.0f} KB")


def snapshot(response: dict) -> dict:
    """A frozen copy is cached data, not a live call: say so in the mode, notice and OSRM source."""
    response["mode"] = "cached"
    response["notice"] = ("Static demo snapshot: this answer was computed once from the backend and is replayed from a "
                          "bundled file, nothing is calculated live. " + response["notice"])
    for source in response["sources"]:
        if source["id"] == "osrm":
            source["mode"] = "real"
            source["retrieved_at"] = response["generated_at"]
            source["method"] = "Street geometry, distance and duration from OSRM, fetched once when the demo files were built."
    return response


def main() -> None:
    index = []
    for track in tracks.load():
        dump(OUT / "tracks" / f"{track['id']}.json", snapshot(tracks.run(track["title"], track["id"])))
        index.append({"id": track["id"], "title": track["title"], "keywords": track["keywords"]})
    dump(OUT / "tracks-index.json", index)

    data = places_response()
    data["places"], data["sources"] = db.query_places(None, BBOX, 200, None)
    dump(OUT / "places.json", data)

    for layer in db.LAYERS:
        features, sources = db.query_layer(layer, BBOX, 500)
        dump(OUT / "layers" / f"{layer}.json", {
            "type": "FeatureCollection", "mode": "cached", "features": features, "sources": sources,
        })


if __name__ == "__main__":
    main()
