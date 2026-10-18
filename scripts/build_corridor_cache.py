"""Builds the corridor cache for the 3D route view (#91 D4, option A).

Fetches OpenStreetMap buildings, green spaces and cultural places once from Overpass for the
area of the predefined demo tracks, keeps what lies near any track, and writes a compact
GeoJSON to frontend/public/corridor-cache.json. The frontend extrudes only the buildings near the
selected route, so the geometry never changes with zoom.

Heights: OSM `height`, else `building:levels` x 3.2 m, else 10 m. Most are estimates and are
marked `est`. Data (c) OpenStreetMap contributors, ODbL.

    python scripts/build_corridor_cache.py <backend-url>   # e.g. http://127.0.0.1:8000
"""
import json
import math
import sys
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

OUT = Path(__file__).resolve().parents[1] / "frontend/public/corridor-cache.json"
OVERPASSES = [
    "https://overpass-api.de/api/interpreter",
    "https://overpass.private.coffee/api/interpreter",
    "https://overpass.kumi.systems/api/interpreter",
]
KEEP_M = 260  # a little wider than the frontend's corridor, so it can be tuned without refetching
MARGIN_DEG = 0.004
TREE_SPACING_M = 26

M_PER_DEG_LAT = 110_540
M_PER_DEG_LNG = 111_320 * math.cos(math.radians(52.22))

CULTURE_BUILDINGS = {"church", "cathedral", "chapel", "palace", "castle", "museum", "synagogue", "temple", "theatre"}
CULTURE_AMENITY = {"theatre", "place_of_worship", "arts_centre", "library"}
CULTURE_TOURISM = {"museum", "gallery", "attraction"}
CULTURE_HISTORIC = {"castle", "palace", "monument", "church", "manor", "fort", "city_gate", "ruins", "tower"}


def is_culture(tags):
    return (tags.get("tourism") in CULTURE_TOURISM or tags.get("amenity") in CULTURE_AMENITY
            or tags.get("historic") in CULTURE_HISTORIC)


def xy(lng, lat):
    return lng * M_PER_DEG_LNG, lat * M_PER_DEG_LAT


def seg_distance(p, a, b):
    dx, dy = b[0] - a[0], b[1] - a[1]
    length = dx * dx + dy * dy
    t = 0 if length == 0 else max(0, min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / length))
    return math.hypot(p[0] - (a[0] + t * dx), p[1] - (a[1] + t * dy))


def track_lines(backend):
    tracks = json.load(urllib.request.urlopen(f"{backend}/api/tracks", timeout=30))["tracks"]
    lines = []
    for track in tracks:
        body = json.dumps({"query": "corridor cache", "track_id": track["id"]}).encode()
        request = urllib.request.Request(f"{backend}/api/tracks/run", body, {"Content-Type": "application/json"})
        result = json.load(urllib.request.urlopen(request, timeout=120))
        for route in result["routes"]:
            lines.append([xy(*point) for point in route["geometry"]["coordinates"]])
        print(f"track {track['id']}: {len(result['routes'])} route(s)")
    return lines


def near(points, segments, limit=KEEP_M):
    for p in points:
        for a, b in segments:
            if seg_distance(p, a, b) <= limit:
                return True
    return False


def overpass(bbox):
    s, w, n, e = bbox
    box = f"{s},{w},{n},{e}"
    query = f"""[out:json][timeout:120];
(
  way["building"]({box});
  way["building:part"]({box});
  way["leisure"~"^(park|garden)$"]({box});
  relation["leisure"~"^(park|garden)$"]({box});
  way["landuse"~"^(grass|forest|recreation_ground|village_green)$"]({box});
  way["natural"="wood"]({box});
  node["historic"]({box});
  node["tourism"~"^(museum|gallery|attraction|artwork)$"]({box});
  node["amenity"~"^(theatre|place_of_worship|arts_centre|library)$"]({box});
);
out geom tags;"""
    data = urllib.parse.urlencode({"data": query}).encode()
    for url in OVERPASSES:
        try:
            request = urllib.request.Request(url, data, {"User-Agent": "warsaw-hackathon-corridor-cache/1.0"})
            return json.load(urllib.request.urlopen(request, timeout=180))["elements"]
        except OSError as error:
            print(f"overpass {url} failed: {error}")
    raise SystemExit("every Overpass mirror failed")


def ring(way):
    return [(round(n["lon"], 6), round(n["lat"], 6)) for n in way.get("geometry", [])]


def assemble(members):
    """Joins outer member ways into closed rings (relations split their outline into pieces)."""
    pieces = [ring(m) for m in members if m.get("role") in ("outer", "") and m.get("geometry")]
    rings = []
    while pieces:
        current = pieces.pop(0)
        changed = True
        while current[0] != current[-1] and changed:
            changed = False
            for i, piece in enumerate(pieces):
                if piece[0] == current[-1]:
                    current += piece[1:]
                elif piece[-1] == current[-1]:
                    current += piece[::-1][1:]
                elif piece[-1] == current[0]:
                    current = piece[:-1] + current
                elif piece[0] == current[0]:
                    current = piece[::-1][:-1] + current
                else:
                    continue
                pieces.pop(i)
                changed = True
                break
        if len(current) >= 4 and current[0] == current[-1]:
            rings.append(current)
    return rings


def height_of(tags):
    def number(value):
        try:
            return float(str(value).split()[0].replace(",", "."))
        except (TypeError, ValueError):
            return None

    height = number(tags.get("height"))
    if height:
        return height, False
    levels = number(tags.get("building:levels"))
    if levels:
        return levels * 3.2 + (1.5 if tags.get("roof:shape") not in (None, "flat") else 0), True
    return 10.0, True


def min_height_of(tags):
    try:
        if tags.get("min_height"):
            return float(str(tags["min_height"]).split()[0])
        if tags.get("building:min_level"):
            return float(tags["building:min_level"]) * 3.2
    except ValueError:
        pass
    return 0.0


def inside(point, polygon):
    x, y = point
    hit = False
    for (x1, y1), (x2, y2) in zip(polygon, polygon[1:]):
        if (y1 > y) != (y2 > y) and x < (x2 - x1) * (y - y1) / (y2 - y1) + x1:
            hit = not hit
    return hit


def trees(polygon, segments):
    """Deterministic grid of tree dots inside a green polygon, near a track."""
    pts = [xy(*p) for p in polygon]
    xs, ys = [p[0] for p in pts], [p[1] for p in pts]
    out = []
    row = 0
    y = min(ys)
    while y <= max(ys):
        x = min(xs) + (TREE_SPACING_M / 2 if row % 2 else 0)
        while x <= max(xs):
            # A small stable jitter so the grid doesn't read as a grid.
            jx = (math.sin(x * 12.9898 + y * 78.233) * 43758.5453) % 1 * 8 - 4
            jy = (math.sin(x * 39.3468 + y * 11.135) * 24634.6345) % 1 * 8 - 4
            p = (x + jx, y + jy)
            if inside(p, pts) and near([p], segments, KEEP_M - 40):
                out.append((round(p[0] / M_PER_DEG_LNG, 6), round(p[1] / M_PER_DEG_LAT, 6)))
            x += TREE_SPACING_M
        y += TREE_SPACING_M * 0.87
        row += 1
    return out


def main(backend):
    lines = track_lines(backend)
    segments = [(a, b) for line in lines for a, b in zip(line, line[1:])]
    lngs = [p[0] / M_PER_DEG_LNG for line in lines for p in line]
    lats = [p[1] / M_PER_DEG_LAT for line in lines for p in line]
    bbox = (min(lats) - MARGIN_DEG, min(lngs) - MARGIN_DEG * 1.6, max(lats) + MARGIN_DEG, max(lngs) + MARGIN_DEG * 1.6)
    elements = overpass(bbox)
    print(f"overpass: {len(elements)} elements in {bbox}")

    # Culture and history means places a visitor would notice: museums, galleries, theatres,
    # churches, palaces, monuments. Not every heritage-listed tenement (Warsaw lists many).
    culture_points = [(e["lon"], e["lat"]) for e in elements if e["type"] == "node" and is_culture(e.get("tags", {}))]
    features = []
    counts = {"building": 0, "green": 0, "tree": 0}
    for e in elements:
        tags = e.get("tags", {})
        if e["type"] == "relation":
            polygons = assemble(e.get("members", []))
        elif e["type"] == "way":
            polygon = ring(e)
            polygons = [polygon] if len(polygon) >= 4 and polygon[0] == polygon[-1] else []
        else:
            continue
        for polygon in polygons:
            points = [xy(*p) for p in polygon]
            if "building" in tags or "building:part" in tags:
                if not near(points, segments):
                    continue
                height, estimated = height_of(tags)
                culture = is_culture(tags) or tags.get("building") in CULTURE_BUILDINGS or any(inside(c, polygon) for c in culture_points)
                features.append({"type": "Feature", "properties": {
                    "k": "b", "h": round(height, 1), "mh": round(min_height_of(tags), 1), "est": estimated, "c": culture,
                    "part": "building:part" in tags,
                }, "geometry": {"type": "Polygon", "coordinates": [polygon]}})
                counts["building"] += 1
            else:
                sample = points[:: max(1, len(points) // 60)]
                if not near(sample, segments, KEEP_M + 60):
                    continue
                features.append({"type": "Feature", "properties": {"k": "g"}, "geometry": {"type": "Polygon", "coordinates": [polygon]}})
                counts["green"] += 1
                for tree in trees(polygon, segments):
                    features.append({"type": "Feature", "properties": {"k": "t"}, "geometry": {"type": "Point", "coordinates": list(tree)}})
                    counts["tree"] += 1

    # A building outline that has parts is drawn by its parts (like the map's hide_3d).
    parts = [f for f in features if f["properties"].get("part")]
    if parts:
        for f in features:
            p = f["properties"]
            if p.get("k") == "b" and not p.get("part"):
                outline = f["geometry"]["coordinates"][0]
                if any(inside(part["geometry"]["coordinates"][0][0], outline) for part in parts):
                    p["skip"] = True
        features = [f for f in features if not f["properties"].get("skip")]

    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps({
        "type": "FeatureCollection",
        "source": "OpenStreetMap contributors (ODbL), via Overpass API",
        "fetched_at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "bbox": [bbox[1], bbox[0], bbox[3], bbox[2]],
        "note": "Building heights are mostly estimated from levels (3.2 m per level) or a 10 m default.",
        "features": features,
    }, separators=(",", ":"), ensure_ascii=False))
    print(f"wrote {OUT} ({OUT.stat().st_size // 1024} KB): {counts}")


if __name__ == "__main__":
    main(sys.argv[1] if len(sys.argv) > 1 else "http://127.0.0.1:8000")
