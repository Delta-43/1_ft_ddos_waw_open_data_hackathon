"""Historical Warsaw map overlays from the city's own WMS service.

wms.um.warszawa.pl/serwis (the same server already catalogued for noise/
greenery in DATA-02) serves real 1935/1939/1945 raster imagery for central
Warsaw. Confirmed render-only - GetFeatureInfo returns no attributes on
these layers, tested across both WMS versions and every INFO_FORMAT, with
a control query against the ORTO layer confirming the server does process
the requests (see docs/DATA.md). So this is a single bounded image overlay
("what did the city look like"), not a tiled basemap or a vector source.

Run as a script to regenerate the committed fixture, re-verifying each
layer renders a real image before writing it:
    PYTHONPATH=backend python -m app.data.historical_layers
"""
import json
import time
from pathlib import Path
from typing import Any

import httpx

ROOT = Path(__file__).resolve().parents[3]
FIXTURE_PATH = ROOT / "data/fixtures/historical-layers.json"

WMS_BASE_URL = "https://wms.um.warszawa.pl/serwis"
USER_AGENT = "warsaw2076-hackathon/1.0 (+https://github.com/Delta-43/1_ft_ddos_waw_open_data_hackathon)"

# Central Warsaw: Stare Miasto, the river, city centre and Lazienki/Ujazdow.
# Wide enough to read as "the city", small enough that one GetMap request
# stays sharp at a reasonable pixel size. min_lon, min_lat, max_lon, max_lat.
DEMO_BBOX = (20.95, 52.19, 21.08, 52.28)

ATTRIBUTION = "Urząd m.st. Warszawy, Biuro Architektury i Planowania Przestrzennego (architektura.um.warszawa.pl)"
SOURCE_ID = "warsaw-historical-wms"

LAYERS = [
    {"id": "warsaw_1935", "title": "Warsaw, 1935 (aerial photo plan)", "year": 1935, "wms_layer": "RASTER_FOTOPLAN_1935"},
    {"id": "warsaw_1939", "title": "Warsaw, 1939 (city plan)", "year": 1939, "wms_layer": "RASTER_PLAN_1939"},
    {"id": "warsaw_1945", "title": "Warsaw, 1945 (aerial photo of the destroyed city)", "year": 1945, "wms_layer": "RASTER_ORTOFOTO_1945"},
]


def get_map_url(wms_layer: str, bbox: tuple[float, float, float, float] = DEMO_BBOX, width: int = 1024, height: int = 768) -> str:
    min_lon, min_lat, max_lon, max_lat = bbox
    params = {
        "SERVICE": "WMS",
        "VERSION": "1.3.0",
        "REQUEST": "GetMap",
        "LAYERS": wms_layer,
        "CRS": "CRS:84",
        "BBOX": f"{min_lon},{min_lat},{max_lon},{max_lat}",
        "WIDTH": str(width),
        "HEIGHT": str(height),
        "FORMAT": "image/jpeg",
    }
    query = "&".join(f"{key}={value}" for key, value in params.items())
    return f"{WMS_BASE_URL}?{query}"


def source(retrieved_at: str | None = None) -> dict[str, Any]:
    return {
        "id": SOURCE_ID,
        "name": "Warsaw historical map overlays (city WMS)",
        "mode": "real",
        "attribution": ATTRIBUTION,
        "url": WMS_BASE_URL,
        "retrieved_at": retrieved_at,
        "data_date": None,
        "method": (
            "Live WMS GetMap render from the city's own historical map service, same "
            "server already used for noise/greenery layers (DATA-02). Render-only: "
            "GetFeatureInfo returns no attributes on these layers (tested, see "
            "docs/DATA.md) - this is a visual overlay, not a vector source."
        ),
    }


def historical_layers() -> list[dict[str, Any]]:
    min_lon, min_lat, max_lon, max_lat = DEMO_BBOX
    return [
        {
            "id": layer["id"],
            "title": layer["title"],
            "year": layer["year"],
            "image_url": get_map_url(layer["wms_layer"]),
            # [[min_lon, min_lat], [max_lon, max_lat]] - matches the GetMap request above.
            "bounds": [[min_lon, min_lat], [max_lon, max_lat]],
            "source_id": SOURCE_ID,
        }
        for layer in LAYERS
    ]


def verify_renders(layers: list[dict[str, Any]], attempts: int = 2) -> None:
    """Fetch each image_url and confirm the server returns a real image, not an
    error page. Raises on the first layer that doesn't render."""
    headers = {"User-Agent": USER_AGENT}
    for layer in layers:
        last_error: Exception | None = None
        for _ in range(attempts):
            try:
                response = httpx.get(layer["image_url"], timeout=30, headers=headers)
            except httpx.HTTPError as exc:
                last_error = exc
                time.sleep(3)
                continue
            content_type = response.headers.get("content-type", "")
            if response.status_code == 200 and content_type.startswith("image/"):
                break
            last_error = RuntimeError(f"{layer['id']}: HTTP {response.status_code}, content-type {content_type!r}")
            time.sleep(3)
        else:
            raise RuntimeError(f"Historical layer did not render: {last_error}")


if __name__ == "__main__":
    layers = historical_layers()
    verify_renders(layers)
    fetched_at = time.strftime("%Y-%m-%dT%H:%M:%S%z")
    result = {"layers": layers, "sources": [source(fetched_at)]}
    FIXTURE_PATH.write_text(json.dumps(result, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"Verified {len(layers)} layers render real images. Wrote {FIXTURE_PATH}")
