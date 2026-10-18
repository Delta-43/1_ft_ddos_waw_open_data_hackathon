"""Builds the transit cache for the route view: stops near the demo tracks and today's scheduled
trips through them, from the Warsaw GTFS feed.

The frontend shows these stops as red dots and moves a small dot along each approaching trip by
its timetable (scheduled position, not live GPS). Only trips heading towards a route's
destination or back towards its start are shown; that choice is made in the browser per route.

Data: Zarząd Transportu Miejskiego w Warszawie (ztm.waw.pl); GTFS by Mikołaj Kuranowski
(mkuran.pl/gtfs). Both credits must stay visible.

    python scripts/build_transit_cache.py <warsaw.zip> <backend-url> [YYYY-MM-DD]
"""
import csv
import io
import json
import math
import sys
import urllib.request
import zipfile
from datetime import datetime, timezone
from pathlib import Path
from zoneinfo import ZoneInfo

OUT = Path(__file__).resolve().parents[1] / "frontend/public/transit-cache.json"
NEAR_M = 320  # a little wider than the frontend's 250 m, so it can be tuned without rebuilding
BEFORE = 4  # stops kept before the first near stop, so an approaching vehicle can be drawn
M_PER_DEG_LAT = 110_540
M_PER_DEG_LNG = 111_320 * math.cos(math.radians(52.22))
MODES = {"0": "tram", "3": "bus", "2": "rail", "1": "metro"}


def xy(lng, lat):
    return lng * M_PER_DEG_LNG, lat * M_PER_DEG_LAT


def seg_distance(p, a, b):
    dx, dy = b[0] - a[0], b[1] - a[1]
    length = dx * dx + dy * dy
    t = 0 if length == 0 else max(0, min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / length))
    return math.hypot(p[0] - (a[0] + t * dx), p[1] - (a[1] + t * dy))


def track_segments(backend):
    tracks = json.load(urllib.request.urlopen(f"{backend}/api/tracks", timeout=30))["tracks"]
    segments = []
    for track in tracks:
        body = json.dumps({"query": "transit cache", "track_id": track["id"]}).encode()
        request = urllib.request.Request(f"{backend}/api/tracks/run", body, {"Content-Type": "application/json"})
        for route in json.load(urllib.request.urlopen(request, timeout=120))["routes"]:
            line = [xy(*p) for p in route["geometry"]["coordinates"]]
            segments += list(zip(line, line[1:]))
    return segments


def seconds(text):
    h, m, s = (int(part) for part in text.split(":"))
    return h * 3600 + m * 60 + s


def table(archive, name):
    return csv.DictReader(io.TextIOWrapper(archive.open(name), encoding="utf-8-sig"))


def main(feed, backend, day):
    segments = track_segments(backend)
    archive = zipfile.ZipFile(feed)
    service_ids = {row["service_id"] for row in table(archive, "calendar_dates.txt")
                   if row["date"] == day.replace("-", "") and row["exception_type"] == "1"}
    if not service_ids:
        raise SystemExit(f"no service on {day} in this feed")

    stops = {}
    near = set()
    for row in table(archive, "stops.txt"):
        if row.get("location_type", "0") not in ("", "0"):
            continue
        lng, lat = float(row["stop_lon"]), float(row["stop_lat"])
        stops[row["stop_id"]] = (row["stop_name"], round(lng, 6), round(lat, 6), row.get("stop_code") or "")
        p = xy(lng, lat)
        if any(seg_distance(p, a, b) <= NEAR_M for a, b in segments):
            near.add(row["stop_id"])
    print(f"{len(near)} stops within {NEAR_M} m of a track")

    routes = {row["route_id"]: (row["route_short_name"], MODES.get(row["route_type"], "bus")) for row in table(archive, "routes.txt")}
    trips = {row["trip_id"]: (row["route_id"], row["trip_headsign"], row["shape_id"])
             for row in table(archive, "trips.txt") if row["service_id"] in service_ids}

    kept = []

    def keep(trip_id, rows):
        indexes = [i for i, r in enumerate(rows) if r[0] in near]
        if not indexes:
            return
        start, end = max(0, indexes[0] - BEFORE), min(len(rows), indexes[-1] + 2)
        part = rows[start:end]
        kept.append((trip_id, [r[0] for r in part], [r[1] for r in part], [r[2] for r in part]))

    current, rows = None, []
    for row in table(archive, "stop_times.txt"):
        trip_id = row["trip_id"]
        if trip_id not in trips:
            continue
        if trip_id != current:
            if current:
                keep(current, rows)
            current, rows = trip_id, []
        rows.append((row["stop_id"], seconds(row["arrival_time"]), float(row["shape_dist_traveled"] or 0)))
    if current:
        keep(current, rows)
    print(f"{len(kept)} trips today pass a near stop")

    shape_ids = {trips[t][2] for t, *_ in kept}
    shapes = {}
    for row in table(archive, "shapes.txt"):
        if row["shape_id"] in shape_ids:
            shapes.setdefault(row["shape_id"], []).append(
                (int(row["shape_pt_sequence"]), float(row["shape_pt_lon"]), float(row["shape_pt_lat"]), float(row["shape_dist_traveled"] or 0)))

    # One path per (shape, first stop, last stop): many trips share it.
    paths, path_index = [], {}
    out_trips = []
    used_stops = set()
    for trip_id, stop_ids, times, dists in kept:
        route_id, headsign, shape_id = trips[trip_id]
        key = (shape_id, stop_ids[0], stop_ids[-1])
        if key not in path_index:
            points = sorted(shapes.get(shape_id, []))
            lo, hi = dists[0], dists[-1]
            part = [[round(lng, 6), round(lat, 6), round(d - lo, 4)] for _, lng, lat, d in points if lo - 1e-6 <= d <= hi + 1e-6]
            if len(part) < 2:  # no shape: straight lines between the stops
                part = [[stops[s][1], stops[s][2], round(d - lo, 4)] for s, d in zip(stop_ids, dists)]
            path_index[key] = len(paths)
            paths.append(part)
        used_stops.update(stop_ids)
        out_trips.append([route_id, headsign, path_index[key], stop_ids, times, [round(d - dists[0], 4) for d in dists]])

    OUT.write_text(json.dumps({
        "source": "Zarząd Transportu Miejskiego w Warszawie (ztm.waw.pl); GTFS by Mikołaj Kuranowski (mkuran.pl/gtfs)",
        "fetched_at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "service_date": day,
        "note": "Scheduled times from the timetable; vehicle positions are interpolated, not live GPS.",
        "near": sorted(near),
        "stops": {s: stops[s] for s in sorted(used_stops)},
        "routes": {r: routes[r] for r in sorted({t[0] for t in out_trips})},
        "paths": paths,
        "trips": out_trips,
    }, separators=(",", ":"), ensure_ascii=False))
    print(f"wrote {OUT} ({OUT.stat().st_size // 1024} KB): {len(paths)} paths, {len(out_trips)} trips")


if __name__ == "__main__":
    today = datetime.now(ZoneInfo("Europe/Warsaw")).date().isoformat()
    main(sys.argv[1], sys.argv[2] if len(sys.argv) > 2 else "http://127.0.0.1:8000", sys.argv[3] if len(sys.argv) > 3 else today)
