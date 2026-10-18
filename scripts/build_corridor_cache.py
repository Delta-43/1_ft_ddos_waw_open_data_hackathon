"""Builds the corridor cache for the 3D route view (#91 D4, option A).

Fetches OpenStreetMap buildings, green spaces and cultural places once from Overpass for the
area of the predefined demo tracks, keeps what lies near any track, and writes a compact
GeoJSON to frontend/public/corridor-cache.json. The frontend extrudes only the buildings near the
selected route, so the geometry never changes with zoom.

Heights: OSM `height`, else `building:levels` x 3.2 m, else 10 m. Most are estimates and are
marked `est`. Data (c) OpenStreetMap contributors, ODbL.

    python scripts/build_corridor_cache.py <backend-url>   # e.g. http://127.0.0.1:8000
    python scripts/build_corridor_cache.py --wiki-only     # refresh only the Wikipedia summaries
"""
import json
import math
import sys
import time
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
  node["amenity"="toilets"]({box});
  node["emergency"="defibrillator"]({box});
  nwr["shop"~"^(supermarket|convenience|greengrocer|bakery|deli|butcher)$"]({box});
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


AMENITY_M = KEEP_M + 150  # toilets and defibrillators a short detour away
# Wikimedia asks for an identifying user agent with a contact URL; generic ones get HTTP 429.
WIKI_UA = {"User-Agent": "FindYourWayDemo/1.0 (https://github.com/Delta-43/1_ft_ddos_waw_open_data_hackathon)"}
KIND_OF = [("tourism", {"museum": "museum", "gallery": "gallery", "attraction": "attraction"}),
           ("amenity", {"theatre": "theatre", "place_of_worship": "place of worship", "arts_centre": "arts centre", "library": "library"}),
           ("historic", {"castle": "castle", "palace": "palace", "monument": "monument", "church": "church", "manor": "manor", "fort": "fort", "city_gate": "city gate", "ruins": "ruins", "tower": "tower"}),
           ("building", {"church": "church", "cathedral": "cathedral", "chapel": "chapel", "palace": "palace", "castle": "castle", "museum": "museum", "synagogue": "synagogue", "theatre": "theatre"})]


def culture_info(tags):
    """Name, kind and links of a culture place, from its OSM tags only."""
    kind = next((names[tags[key]] for key, names in KIND_OF if tags.get(key) in names), None)
    info = {"n": tags.get("name:en") or tags.get("name"), "npl": tags.get("name"), "ck": kind,
            "wp": tags.get("wikipedia"), "wd": tags.get("wikidata"), "sd": tags.get("start_date"),
            "arch": tags.get("architect"), "her": bool(tags.get("heritage") or tags.get("heritage:operator"))}
    return {k: v for k, v in info.items() if v}


def wiki_get(url):
    time.sleep(0.25)  # stay well inside Wikimedia's rate limits
    return json.load(urllib.request.urlopen(urllib.request.Request(url, headers=WIKI_UA), timeout=20))


def first_sentences(text, limit=320):
    out = ""
    for sentence in text.replace("\n", " ").split(". "):
        candidate = (out + ". " if out else "") + sentence.rstrip(".")
        if len(candidate) > limit and out:
            break
        out = candidate
    return out.rstrip(".") + "."


def wiki_summaries(wikipedia, wikidata):
    """Short Polish and English summaries from Wikipedia (CC BY-SA), linked from OSM's tags."""
    titles = {}
    if wikidata:
        try:
            links = wiki_get(f"https://www.wikidata.org/w/api.php?action=wbgetentities&ids={wikidata}&props=sitelinks&sitefilter=plwiki|enwiki&format=json")
            for site, lang in (("plwiki", "pl"), ("enwiki", "en")):
                link = links["entities"][wikidata]["sitelinks"].get(site)
                if link:
                    titles[lang] = link["title"]
        except (OSError, KeyError, ValueError):
            pass
    if wikipedia and ":" in wikipedia:
        lang, title = wikipedia.split(":", 1)
        titles.setdefault(lang, title)
    out = {}
    for lang in ("en", "pl"):
        if lang not in titles:
            continue
        try:
            page = wiki_get(f"https://{lang}.wikipedia.org/api/rest_v1/page/summary/{urllib.parse.quote(titles[lang].replace(' ', '_'))}")
            if page.get("extract"):
                out[f"s{lang}"] = first_sentences(page["extract"])
                out[f"u{lang}"] = page.get("content_urls", {}).get("desktop", {}).get("page", "")
        except (OSError, KeyError, ValueError):
            pass
    return out


def fill_summaries(features):
    """Wikipedia summaries for the culture buildings OSM links to an article (fetched once per article)."""
    cache = {}
    for f in features:
        p = f["properties"]
        key = (p.get("wp"), p.get("wd"))
        if p.get("c") and any(key):
            if key not in cache:
                cache[key] = wiki_summaries(*key)
            p.update(cache[key])
    print(f"wikipedia: {sum(1 for v in cache.values() if v)} of {len(cache)} linked articles summarised")


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
    culture_nodes = [((e["lon"], e["lat"]), e.get("tags", {})) for e in elements if e["type"] == "node" and is_culture(e.get("tags", {}))]
    culture_points = [point for point, _ in culture_nodes]
    features = []
    counts = {"building": 0, "green": 0, "tree": 0, "amenity": 0, "shop": 0}
    for e in elements:
        tags = e.get("tags", {})
        # Toilets, defibrillators and grocery shops: points (a shop drawn as an area uses its middle).
        point = (e["lon"], e["lat"]) if e["type"] == "node" else None
        if point is None and e.get("geometry"):
            geometry = e["geometry"]
            point = (sum(n["lon"] for n in geometry) / len(geometry), sum(n["lat"] for n in geometry) / len(geometry))
        amenity = "toilets" if tags.get("amenity") == "toilets" else "aed" if tags.get("emergency") == "defibrillator" else None
        if amenity and point and near([xy(*point)], segments, AMENITY_M):
            props = {"k": "a", "kind": amenity, **{k: tags[k] for k in ("name", "access", "fee", "opening_hours", "wheelchair", "indoor", "level", "operator") if k in tags}}
            features.append({"type": "Feature", "properties": props, "geometry": {"type": "Point", "coordinates": [round(point[0], 6), round(point[1], 6)]}})
            counts["amenity"] += 1
        if tags.get("shop") and tags.get("name") and point:
            props = {"k": "s", "kind": tags["shop"], "name": tags["name"], **({"opening_hours": tags["opening_hours"]} if "opening_hours" in tags else {})}
            features.append({"type": "Feature", "properties": props, "geometry": {"type": "Point", "coordinates": [round(point[0], 6), round(point[1], 6)]}})
            counts["shop"] += 1
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
                inner = next((node_tags for point, node_tags in culture_nodes if inside(point, polygon)), None)
                culture = is_culture(tags) or tags.get("building") in CULTURE_BUILDINGS or inner is not None
                props = {"k": "b", "h": round(height, 1), "mh": round(min_height_of(tags), 1), "est": estimated, "c": culture,
                         "part": "building:part" in tags}
                if culture:
                    # The building's own tags first, then the culture place inside it (e.g. a museum node).
                    props.update({**culture_info(inner or {}), **culture_info(tags)})
                features.append({"type": "Feature", "properties": props, "geometry": {"type": "Polygon", "coordinates": [polygon]}})
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

    fill_summaries(features)

    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps({
        "type": "FeatureCollection",
        "source": "OpenStreetMap contributors (ODbL), via Overpass API",
        "fetched_at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "bbox": [bbox[1], bbox[0], bbox[3], bbox[2]],
        "note": "Building heights are mostly estimated from levels (3.2 m per level) or a 10 m default. Culture summaries (se/sp) are from Wikipedia, CC BY-SA 4.0, linked by OSM's wikipedia/wikidata tags.",
        "features": features,
    }, separators=(",", ":"), ensure_ascii=False))
    print(f"wrote {OUT} ({OUT.stat().st_size // 1024} KB): {counts}")


if __name__ == "__main__":
    if "--wiki-only" in sys.argv:  # refill summaries in the existing cache without querying Overpass again
        cached = json.loads(OUT.read_text(encoding="utf-8"))
        fill_summaries(cached["features"])
        OUT.write_text(json.dumps(cached, separators=(",", ":"), ensure_ascii=False))
    else:
        main(sys.argv[1] if len(sys.argv) > 1 else "http://127.0.0.1:8000")
