"""Builds example car-free outings: public transport only, with a grocery stop on the way.

For a few demo destinations it searches today's Warsaw timetable (GTFS) for the earliest way
from the fixed Centrum start: walk to a stop, ride, shop for a few minutes at a real grocery
shop near a stop (OpenStreetMap, from corridor-cache.json), ride on, walk to the destination.
The results are precomputed examples for the demo, not a live journey planner. Walking legs are
straight lines and are labelled so.

    python scripts/build_transit_examples.py <warsaw.zip> <backend-url> [YYYY-MM-DD] [HH:MM]
"""
import bisect
import csv
import io
import json
import math
import sys
import urllib.request
import zipfile
from datetime import datetime
from pathlib import Path
from zoneinfo import ZoneInfo

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "frontend/public/transit-examples.json"
CORRIDOR = ROOT / "frontend/public/corridor-cache.json"
TRACKS = ["calm-park-museum", "art-gallery-stroll", "botanical-sky"]
ORIGIN_M = 550      # walk to the first stop
SHOP_M = 300        # shop to its stop
DEST_M = 650        # last stop to the destination
DWELL_S = 12 * 60   # time in the shop
WALK_MS = 1.25      # walking speed, metres per second
DETOUR = 1.3        # streets are longer than straight lines
GROCERIES = {"supermarket", "greengrocer", "convenience", "bakery", "deli", "butcher"}
MODES = {"0": "tram", "3": "bus", "1": "metro", "2": "rail"}
M_PER_DEG_LAT = 110_540
M_PER_DEG_LNG = 111_320 * math.cos(math.radians(52.22))


def metres(a, b):
    return math.hypot((a[0] - b[0]) * M_PER_DEG_LNG, (a[1] - b[1]) * M_PER_DEG_LAT)


def walk_s(a, b):
    return metres(a, b) * DETOUR / WALK_MS


def seconds(text):
    h, m, s = (int(x) for x in text.split(":"))
    return h * 3600 + m * 60 + s


def clock(sec):
    return f"{int(sec // 3600) % 24:02d}:{int(sec % 3600 // 60):02d}"


def table(archive, name):
    return csv.DictReader(io.TextIOWrapper(archive.open(name), encoding="utf-8-sig"))


def destinations(backend):
    out = []
    for track_id in TRACKS:
        body = json.dumps({"query": "transit example", "track_id": track_id}).encode()
        request = urllib.request.Request(f"{backend}/api/tracks/run", body, {"Content-Type": "application/json"})
        result = json.load(urllib.request.urlopen(request, timeout=120))
        route = result["routes"][0]
        coords = route["geometry"]["coordinates"]
        last = max(route["stops"], key=lambda s: s["order"])
        place = next(p for p in route["places"] if p["id"] == last["place_id"])
        out.append({"track_id": track_id, "track_title": result["track"]["title"], "origin": coords[0],
                    "name": place["name"], "point": (place["longitude"], place["latitude"])})
    return out


def main(feed, backend, day, start):
    dests = destinations(backend)
    origin = tuple(dests[0]["origin"])
    shops = [(tuple(f["geometry"]["coordinates"]), f["properties"]) for f in json.loads(CORRIDOR.read_text())["features"]
             if f["properties"].get("k") == "s" and f["properties"].get("kind") in GROCERIES]
    print(f"{len(shops)} grocery shops in the cache")

    archive = zipfile.ZipFile(feed)
    services = {r["service_id"] for r in table(archive, "calendar_dates.txt") if r["date"] == day.replace("-", "") and r["exception_type"] == "1"}
    stops = {r["stop_id"]: (r["stop_name"], r.get("stop_code") or "", (float(r["stop_lon"]), float(r["stop_lat"])))
             for r in table(archive, "stops.txt") if r.get("location_type", "0") in ("", "0")}
    box = [p for d in dests for p in (d["point"],)] + [origin] + [p for p, _ in shops]
    west, east = min(p[0] for p in box) - 0.01, max(p[0] for p in box) + 0.01
    south, north = min(p[1] for p in box) - 0.006, max(p[1] for p in box) + 0.006
    region = {s for s, (_, _, p) in stops.items() if west <= p[0] <= east and south <= p[1] <= north}
    routes = {r["route_id"]: (r["route_short_name"], MODES.get(r["route_type"], "bus")) for r in table(archive, "routes.txt")}
    trips = {r["trip_id"]: (r["route_id"], r["trip_headsign"], r["shape_id"]) for r in table(archive, "trips.txt") if r["service_id"] in services}

    t0, t1 = start - 600, start + 2 * 3600
    rows = {}
    for r in table(archive, "stop_times.txt"):
        if r["trip_id"] in trips and r["stop_id"] in region:
            t = seconds(r["departure_time"])
            if t0 <= t <= t1:
                rows.setdefault(r["trip_id"], []).append((int(r["stop_sequence"]), r["stop_id"], t, float(r["shape_dist_traveled"] or 0)))
    for trip in rows.values():
        trip.sort()
    departures = {}
    for trip_id, trip in rows.items():
        for i, (_, stop_id, t, _) in enumerate(trip):
            departures.setdefault(stop_id, []).append((t, trip_id, i))
    for value in departures.values():
        value.sort()
    print(f"{len(rows)} trips in the window")

    near = lambda point, limit: [s for s in region if s in departures and metres(stops[s][2], point) <= limit]
    examples = []
    for dest in dests:
        goal = dest["point"]
        # For each stop: departures with the best arrival at the goal from there, and a suffix minimum.
        onward = {}
        for stop_id, deps in departures.items():
            best = []
            for t, trip_id, i in deps:
                trip = rows[trip_id]
                arrive = min(((trip[j][2] + walk_s(stops[trip[j][1]][2], goal), j) for j in range(i + 1, len(trip))
                              if metres(stops[trip[j][1]][2], goal) <= DEST_M), default=None)
                best.append((t, arrive, trip_id, i))
            suffix, running = [None] * len(best), None
            for k in range(len(best) - 1, -1, -1):
                if best[k][1] is not None and (running is None or best[k][1][0] < running[1][0]):
                    running = best[k]
                suffix[k] = running
            onward[stop_id] = ([b[0] for b in best], suffix)

        winner = None
        for o in near(origin, ORIGIN_M):
            ready = start + walk_s(origin, stops[o][2])
            for t, trip_id, i in departures[o][bisect.bisect_left(departures[o], (ready,)):][:40]:
                trip = rows[trip_id]
                for j in range(i + 2, len(trip)):  # ride at least two stops
                    s1 = trip[j][1]
                    for point, shop in shops:
                        if metres(stops[s1][2], point) > SHOP_M or metres(point, origin) < 400 or metres(point, goal) < 300:
                            continue
                        done = trip[j][2] + walk_s(stops[s1][2], point) + DWELL_S
                        for s2 in near(point, SHOP_M):
                            times, suffix = onward[s2]
                            k = bisect.bisect_left(times, done + walk_s(point, stops[s2][2]))
                            if k >= len(times) or suffix[k] is None:
                                continue
                            t2, (arrive, m), trip2, k2 = suffix[k]
                            if trip2 == trip_id:
                                continue
                            if winner is None or arrive < winner[0]:
                                winner = (arrive, (o, trip_id, i, j), (point, shop, s1, s2), (trip2, k2, m))
        if winner:
            examples.append((dest, winner))
            print(f"{dest['name']}: arrive {clock(winner[0])} via {winner[2][1]['name']}")
        else:
            print(f"{dest['name']}: no itinerary found")

    # Shapes for the transit legs actually used.
    used = {trips[w[1][1]][2] for _, w in examples} | {trips[w[3][0]][2] for _, w in examples}
    shapes = {}
    for r in table(archive, "shapes.txt"):
        if r["shape_id"] in used:
            shapes.setdefault(r["shape_id"], []).append((int(r["shape_pt_sequence"]), float(r["shape_pt_lon"]), float(r["shape_pt_lat"]), float(r["shape_dist_traveled"] or 0)))

    def ride(trip_id, i, j):
        route_id, headsign, shape_id = trips[trip_id]
        trip = rows[trip_id]
        lo, hi = trip[i][3], trip[j][3]
        path = [[round(x, 6), round(y, 6)] for _, x, y, d in sorted(shapes.get(shape_id, [])) if lo - 1e-6 <= d <= hi + 1e-6]
        if len(path) < 2:
            path = [list(stops[trip[n][1]][2]) for n in range(i, j + 1)]
        line, mode = routes[route_id]
        return {"mode": mode, "line": line, "headsign": headsign,
                "from": f"{stops[trip[i][1]][0]} {stops[trip[i][1]][1]}".strip(), "to": f"{stops[trip[j][1]][0]} {stops[trip[j][1]][1]}".strip(),
                "depart": clock(trip[i][2]), "arrive": clock(trip[j][2]), "stops": j - i, "path": path}

    def walk(a, b, label_from, label_to):
        return {"mode": "walk", "from": label_from, "to": label_to, "minutes": max(1, round(walk_s(a, b) / 60)),
                "metres": round(metres(a, b) * DETOUR), "path": [[round(a[0], 6), round(a[1], 6)], [round(b[0], 6), round(b[1], 6)]], "straight": True}

    out = []
    for dest, (arrive, (o, trip1, i, j), (point, shop, s1, s2), (trip2, k2, m)) in examples:
        leg1, leg2 = ride(trip1, i, j), ride(trip2, k2, m)
        last_stop = stops[rows[trip2][m][1]][2]
        legs = [walk(origin, stops[o][2], "Centrum", leg1["from"]), leg1,
                walk(stops[s1][2], point, leg1["to"], shop["name"]),
                {"mode": "shop", "name": shop["name"], "kind": shop["kind"], "minutes": DWELL_S // 60, "point": [point[0], point[1]],
                 "opening_hours": shop.get("opening_hours")},
                walk(point, stops[s2][2], shop["name"], leg2["from"]), leg2,
                walk(last_stop, dest["point"], leg2["to"], dest["name"])]
        out.append({"id": f"transit-groceries-{dest['track_id']}", "track_id": dest["track_id"],
                    "destination": {"name": dest["name"], "point": list(dest["point"])},
                    "depart": clock(start), "arrive": clock(arrive), "duration_s": round(arrive - start), "legs": legs})

    OUT.write_text(json.dumps({
        "source": "Timetable: Zarząd Transportu Miejskiego w Warszawie (ztm.waw.pl), GTFS by Mikołaj Kuranowski (mkuran.pl/gtfs); shops: OpenStreetMap (ODbL)",
        "service_date": day, "start": clock(start),
        "note": "Example itineraries computed once from the timetable for the demo; not a live journey planner. Walking legs are drawn as straight lines.",
        "examples": out,
    }, ensure_ascii=False, separators=(",", ":")))
    print(f"wrote {OUT} ({OUT.stat().st_size // 1024} KB): {len(out)} examples")


if __name__ == "__main__":
    today = datetime.now(ZoneInfo("Europe/Warsaw")).date().isoformat()
    day = sys.argv[3] if len(sys.argv) > 3 else today
    h, mi = (sys.argv[4] if len(sys.argv) > 4 else "11:00").split(":")
    main(sys.argv[1], sys.argv[2] if len(sys.argv) > 2 else "http://127.0.0.1:8000", day, int(h) * 3600 + int(mi) * 60)
