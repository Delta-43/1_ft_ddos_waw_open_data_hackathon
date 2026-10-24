"""Bundle a small Warsaw vector-tile extract (PMTiles) and the map fonts for the static GitHub Pages demo.

The demo must not load anything from other hosts at runtime, so this copies, once, the OpenMapTiles-schema
tiles that the live map style reads from OpenFreeMap (https://openfreemap.org, no key, free for any use) for
central Warsaw only, plus the Noto Sans glyph ranges the labels need. Data (c) OpenStreetMap contributors (ODbL),
schema (c) OpenMapTiles. Needs `pip install pmtiles mapbox-vector-tile`. Output: frontend/public/demo/warsaw.pmtiles and
frontend/public/demo/fonts/.

    python scripts/build_demo_tiles.py
"""
import gzip
import json
import math
import time
import urllib.request

import mapbox_vector_tile
from pathlib import Path

from pmtiles.tile import Compression, TileType, zxy_to_tileid
from pmtiles.writer import Writer

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "frontend/public/demo"
TILEJSON = "https://tiles.openfreemap.org/planet"
GLYPHS = "https://tiles.openfreemap.org/fonts/Noto%20Sans%20Regular/{range}.pbf"
# (min zoom, max zoom, west, south, east, north): wide and shallow, narrowing to the street-level core.
TIERS = [
    (5, 10, 20.4, 51.8, 21.8, 52.6),
    (11, 12, 20.8, 52.05, 21.25, 52.35),
    (13, 14, 20.96, 52.19, 21.08, 52.27),
]
# Only what frontend/src/map/style.ts, corridor.ts and the building modules read: the rest (POIs, house numbers,
# dozens of translated names) is dropped, which cuts the extract to a fraction of its size.
LAYERS = ["boundary", "building", "landcover", "landuse", "park", "place", "transportation", "water", "water_name", "waterway"]
PROPERTIES = {"class", "brunnel", "admin_level", "name", "name:pl", "render_height", "render_min_height", "hide_3d"}
# Basic Latin + Latin-1, Latin Extended-A/B (Polish letters), general punctuation (dashes, quotes).
GLYPH_RANGES = ["0-255", "256-511", "512-767", "8192-8447"]
UA = {"User-Agent": "warsaw-2076-demo-build (one-off tile extract; github.com/Delta-43/1_ft_ddos_waw_open_data_hackathon)"}


def tile_xy(lon: float, lat: float, z: int) -> tuple[int, int]:
    n = 2**z
    x = int((lon + 180) / 360 * n)
    y = int((1 - math.asinh(math.tan(math.radians(lat))) / math.pi) / 2 * n)
    return x, y


def get(url: str) -> bytes | None:
    for attempt in range(3):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=30) as response:
                return response.read()
        except urllib.error.HTTPError as error:
            if error.code in (404, 204):
                return None
        except OSError:
            pass
        time.sleep(1 + attempt)
    raise RuntimeError(f"failed: {url}")


def slim(data: bytes) -> bytes:
    """Re-encode a tile keeping only the layers and properties the map style uses."""
    if data[:2] == b"\x1f\x8b":
        data = gzip.decompress(data)
    decoded = mapbox_vector_tile.decode(data, y_coord_down=True)
    layers = []
    for name in LAYERS:
        if name not in decoded:
            continue
        features = decoded[name]["features"]
        for feature in features:
            feature["properties"] = {k: v for k, v in feature["properties"].items() if k in PROPERTIES}
        layers.append({"name": name, "features": features})
    return gzip.compress(mapbox_vector_tile.encode(layers, y_coord_down=True, extents=4096), mtime=0)


def main() -> None:
    template = json.loads(get(TILEJSON))["tiles"][0]
    tiles = []
    for lo, hi, west, south, east, north in TIERS:
        for z in range(lo, hi + 1):
            x0, y1 = tile_xy(west, south, z)
            x1, y0 = tile_xy(east, north, z)
            tiles += [(z, x, y) for x in range(x0, x1 + 1) for y in range(y0, y1 + 1)]
    print(len(tiles), "tiles")
    OUT.mkdir(parents=True, exist_ok=True)
    path = OUT / "warsaw.pmtiles"
    with path.open("wb") as handle:
        writer = Writer(handle)
        for z, x, y in sorted(tiles, key=lambda t: zxy_to_tileid(*t)):
            data = get(template.format(z=z, x=x, y=y))
            if data:
                writer.write_tile(zxy_to_tileid(z, x, y), slim(data))
            time.sleep(0.03)
        west, south, east, north = TIERS[0][2:]
        writer.finalize(
            {"tile_type": TileType.MVT, "tile_compression": Compression.GZIP, "min_zoom": 5, "max_zoom": 14,
             "min_lon_e7": int(west * 1e7), "min_lat_e7": int(south * 1e7), "max_lon_e7": int(east * 1e7),
             "max_lat_e7": int(north * 1e7), "center_zoom": 12, "center_lon_e7": int(21.03 * 1e7),
             "center_lat_e7": int(52.24 * 1e7)},
            {"name": "Warsaw demo extract", "attribution": "© OpenStreetMap contributors (ODbL), OpenMapTiles schema, via OpenFreeMap"},
        )
    print(path, f"{path.stat().st_size / 1e6:.1f} MB")
    fonts = OUT / "fonts" / "Noto Sans Regular"
    fonts.mkdir(parents=True, exist_ok=True)
    for glyph_range in GLYPH_RANGES:
        (fonts / f"{glyph_range}.pbf").write_bytes(get(GLYPHS.format(range=glyph_range)) or b"")


if __name__ == "__main__":
    main()
