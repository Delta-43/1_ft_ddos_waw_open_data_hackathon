"""Candidate museum outings: one shared service for REST and MCP.

Code supplies every fact in the response: places and opening hours come from the
OSM snapshot, geometry from OSRM (or labelled straight lines), scores from
app.services.scoring. Explanations only restate those values.
"""
import json
import math
import re
from dataclasses import dataclass
from datetime import datetime, timezone
from functools import cache
from pathlib import Path

from app.contract import CONTRACT_VERSION, RouteRequest
from app.services import ai, osm_context, routing, scoring

ROOT = Path(__file__).resolve().parents[3]
PLACES_SNAPSHOT = ROOT / "data/fixtures/osm-places-sample.json"

DEFAULT_START = (21.0122, 52.2297)  # Centrum, contract example start
MUSEUM_VISIT_S = 2700
PARK_VISIT_S = 600
MAX_PARK_DETOUR_M = 700
STRAIGHT_SPEED_MPS = {"walk": 1.3, "bike": 4.0}
CATEGORY = {"museum": "museum", "gallery": "museum", "park": "park", "garden": "park"}

QUIET_WORDS = ("quiet", "calm", "peace", "cisz", "spokoj")
GREEN_WORDS = ("green", "park", "garden", "nature", "tree", "ziel")
BIKE_WORDS = ("bike", "cycl", "rower")
ART_WORDS = ("art", "gallery", "contemporary", "sztuk")


@dataclass
class Interpreted:
    interests: list[str]
    travel_mode: str
    max_duration_s: int | None
    quiet: float
    green: float
    interpreted_by: str = "rules"


def interpret(request: RouteRequest, use_model: bool = True) -> Interpreted:
    """Model reading if configured, else keyword rules; explicit preferences always win."""
    q = request.query.lower()
    prefs = request.preferences
    hours = re.search(r"(\d+(?:[.,]\d+)?)\s*(?:h\b|hour|godz)", q)
    result = Interpreted(
        interests=["art" if any(w in q for w in ART_WORDS) else "museums"],
        travel_mode="bike" if any(w in q for w in BIKE_WORDS) else "walk",
        max_duration_s=int(float(hours.group(1).replace(",", ".")) * 3600) if hours else None,
        quiet=0.8 if any(w in q for w in QUIET_WORDS) else 0.3,
        green=0.8 if any(w in q for w in GREEN_WORDS) else 0.3,
    )
    if result.max_duration_s is not None:
        result.max_duration_s = max(900, min(28800, result.max_duration_s))
    model = ai.model_preferences(request.query) if use_model else None
    if model:
        result = Interpreted(**model, interpreted_by="model")
    if prefs:
        result.interests = prefs.interests or result.interests
        result.travel_mode = prefs.travel_mode or result.travel_mode
        result.max_duration_s = prefs.max_duration_s or result.max_duration_s
        if prefs.priorities:
            if prefs.priorities.quiet is not None:
                result.quiet = prefs.priorities.quiet
            if prefs.priorities.green is not None:
                result.green = prefs.priorities.green
    return result


@cache
def _snapshot() -> dict:
    return json.loads(PLACES_SNAPSHOT.read_text(encoding="utf-8"))


def _place(raw: dict) -> dict:
    return {
        "id": raw["id"],
        "name": raw["name"],
        "longitude": raw["longitude"],
        "latitude": raw["latitude"],
        "category": CATEGORY.get(raw["category"], "generic"),
        "summary": None,
        "opening_hours": raw.get("opening_hours"),
        "address": None,
        "website": raw.get("website"),
        "source_id": "osm-places",
    }


def _usable(raw: dict) -> bool:
    return raw.get("opening_hours") != "closed" and "remont" not in raw["name"].lower()


def museums(interests: list[str]) -> list[dict]:
    raws = [r for r in _snapshot()["places"] if r["category"] in ("museum", "gallery") and _usable(r)]
    if any(i.lower() in ("art", "gallery", "galleries") for i in interests):
        raws = [r for r in raws if r["category"] == "gallery"] or raws
    return [_place(r) for r in raws]


def parks() -> list[dict]:
    # Public parks only; community gardens and ministry grounds are poor detours.
    return [_place(r) for r in _snapshot()["places"] if r["category"] == "park"]


def _xy(p) -> tuple[float, float]:
    return scoring.project(p["longitude"], p["latitude"]) if isinstance(p, dict) else scoring.project(*p)


def _dist(a, b) -> float:
    return math.dist(_xy(a), _xy(b))


def _nearest_order(start, places: list[dict], count: int) -> list[dict]:
    order, here, left = [], start, list(places)
    while left and len(order) < count:
        nxt = min(left, key=lambda p: _dist(here, p))
        order.append(nxt)
        left.remove(nxt)
        here = nxt
    return order


def _with_parks(start, stops: list[dict]) -> list[dict]:
    """Insert the cheapest park detour into each leg, if it is short enough."""
    out, here, used = [], start, set()
    for stop in stops:
        options = [p for p in parks() if p["id"] not in used]
        best = min(options, key=lambda p: _dist(here, p) + _dist(p, stop) - _dist(here, stop))
        if _dist(here, best) + _dist(best, stop) - _dist(here, stop) <= MAX_PARK_DETOUR_M:
            out.append(best)
            used.add(best["id"])
        out.append(stop)
        here = stop
    return out


def candidate_stops(start, prefs: Interpreted) -> list[tuple[str, str, list[dict]]]:
    budget = prefs.max_duration_s or 10800
    count = max(1, min(3, (budget - 2700) // MUSEUM_VISIT_S))
    pool = museums(prefs.interests)
    direct = _nearest_order(start, pool, count)
    in_parks = [m for m in pool if scoring.is_green(_xy(m))]
    park_museums = _nearest_order(start, in_parks, count) if in_parks else direct
    candidates = [
        ("direct", "Direct museum route", direct),
        ("green", "Museums through the parks", _with_parks(start, direct)),
        ("park-museums", "Museums inside the parks", _with_parks(start, park_museums)),
    ]
    seen, unique = set(), []
    for key, name, stops in candidates:
        ids = tuple(s["id"] for s in stops)
        if ids not in seen:
            seen.add(ids)
            unique.append((key, name, stops))
    return unique


def _geometry(mode: str, start, stops: list[dict]):
    waypoints = [start] + [(s["longitude"], s["latitude"]) for s in stops]
    try:
        street = routing.street_route(mode, waypoints)
        return street.coordinates, street.distance_m, street.duration_s, street.leg_durations_s, street.origin
    except routing.RoutingUnavailable:
        coords = [list(w) for w in waypoints]
        speed = STRAIGHT_SPEED_MPS[mode]
        legs = [_dist(a, b) / speed for a, b in zip(waypoints, waypoints[1:])]
        return coords, scoring.line_length_m(coords), sum(legs), legs, "straight_line"


def _visit_s(stop: dict) -> int:
    return MUSEUM_VISIT_S if stop["category"] == "museum" else PARK_VISIT_S


def _explain(name: str, route: dict, prefs: Interpreted, baseline: dict | None) -> str:
    m = route["metrics"]
    museums_ = [p["name"] for p in route["places"] if p["category"] == "museum"]
    parks_ = [p["name"] for p in route["places"] if p["category"] == "park"]
    minutes = round(m["duration_s"]["value"] / 60)
    verb = "walking" if prefs.travel_mode == "walk" else "cycling"
    text = f"Visits {', '.join(museums_)}"
    if parks_:
        text += f" via {', '.join(parks_)}"
    text += f"; {m['distance_m']['value'] / 1000:.1f} km, about {minutes} min {verb}."
    green, quiet = m["green_score"]["value"], m["quiet_score"]["value"]
    if baseline and baseline is not route:
        b = baseline["metrics"]
        text += (f" Green proxy {green:.2f} vs {b['green_score']['value']:.2f}"
                 f" and quiet proxy {quiet:.2f} vs {b['quiet_score']['value']:.2f} on the direct route.")
    else:
        text += f" Green proxy {green:.2f}, quiet proxy {quiet:.2f}."
    return text


def _utility(route: dict, prefs: Interpreted, total_s: float) -> float:
    m = route["metrics"]
    weight = (prefs.quiet + prefs.green) or 1
    score = (prefs.quiet * m["quiet_score"]["value"] + prefs.green * m["green_score"]["value"]) / weight
    score -= 0.05 * m["duration_s"]["value"] / 3600
    if prefs.max_duration_s and total_s > prefs.max_duration_s:
        score -= 1
    return score


def _sources(origins: set[str]) -> list[dict]:
    places, ctx = _snapshot(), osm_context.load()
    sources = [
        {"id": "osm-places", "name": "OpenStreetMap museums, galleries and parks", "mode": "real",
         "attribution": places["attribution"], "url": "https://www.openstreetmap.org/copyright",
         "retrieved_at": places["fetched_at"].replace("+0200", "+02:00"), "data_date": None,
         "method": "Overpass snapshot of the Ujazdow and Lazienki area; opening hours are raw OSM text."},
        {"id": "green-proxy", "name": "Greenery proxy from OSM parks", "mode": "proxy",
         "attribution": ctx["attribution"], "url": "https://www.openstreetmap.org/copyright",
         "retrieved_at": ctx["fetched_at"], "data_date": None, "method": scoring.GREEN_METHOD},
        {"id": "quiet-proxy", "name": "Traffic-exposure proxy from OSM major roads", "mode": "proxy",
         "attribution": ctx["attribution"], "url": "https://www.openstreetmap.org/copyright",
         "retrieved_at": ctx["fetched_at"], "data_date": None, "method": scoring.QUIET_METHOD},
    ]
    if origins & {"live", "cached"}:
        sources.append({
            "id": "osrm", "name": "OSRM street routing", "mode": "real",
            "attribution": routing.ATTRIBUTION, "url": "https://routing.openstreetmap.de/about.html",
            "retrieved_at": None, "data_date": None,
            "method": "Street geometry, distance and duration from OSRM. "
                      + ("Some routes were served from a cached response." if "cached" in origins else ""),
        })
    if "straight_line" in origins:
        sources.append({
            "id": "straight-line", "name": "Straight-line fallback", "mode": "simulated",
            "attribution": "Computed by the Warsaw 2076 backend", "url": None, "retrieved_at": None,
            "data_date": None,
            "method": "Routing service unavailable: straight lines between stops, duration at a fixed "
                      "speed. Not street directions.",
        })
    return sources


def plan(request: RouteRequest) -> dict:
    prefs = interpret(request)
    start_pt = request.preferences.start if request.preferences and request.preferences.start else None
    start = (start_pt.longitude, start_pt.latitude) if start_pt else DEFAULT_START
    routes, origins = [], set()
    for key, name, stops in candidate_stops(start, prefs):
        coords, distance, duration, legs, origin = _geometry(prefs.travel_mode, start, stops)
        origins.add(origin)
        geo_source = "straight-line" if origin == "straight_line" else "osrm"
        scores = scoring.score_line(coords)
        offset, stop_rows = 0.0, []
        for i, (stop, leg) in enumerate(zip(stops, legs), start=1):
            offset += leg
            stop_rows.append({"order": i, "place_id": stop["id"], "arrival_offset_s": round(offset),
                              "visit_duration_s": _visit_s(stop)})
            offset += _visit_s(stop)
        route = {
            "id": key, "name": name, "rank": 0, "recommended": False, "travel_mode": prefs.travel_mode,
            "explanation": "",
            "geometry": {"type": "LineString", "coordinates": coords},
            "geometry_kind": "straight_line" if origin == "straight_line" else "street",
            "geometry_source_id": geo_source,
            "metrics": {
                "distance_m": {"value": round(distance), "source_id": geo_source},
                "duration_s": {"value": round(duration), "source_id": geo_source},
                "green_score": {"value": scores["green_score"], "source_id": "green-proxy"},
                "quiet_score": {"value": scores["quiet_score"], "source_id": "quiet-proxy"},
            },
            "stops": stop_rows,
            "places": stops,
            "_utility": _utility({"metrics": {
                "quiet_score": {"value": scores["quiet_score"]},
                "green_score": {"value": scores["green_score"]},
                "duration_s": {"value": duration}}}, prefs, offset),
        }
        routes.append(route)
    routes.sort(key=lambda r: r.pop("_utility"), reverse=True)
    baseline = next((r for r in routes if r["id"] == "direct"), None)
    for rank, route in enumerate(routes, start=1):
        route["rank"] = rank
        route["recommended"] = rank == 1
        route["explanation"] = _explain(route["name"], route, prefs, baseline)
    worded = ai.model_explanations(request.query, routes)
    for route in routes:
        route["explanation"] = worded.get(route["id"], route["explanation"])
    if "straight_line" in origins:
        mode = "mock"
        notice = ("Routing service unavailable: some routes are straight lines, not street directions. "
                  "Places are real OpenStreetMap data; green and quiet scores are proxies.")
    else:
        mode = "cached" if "cached" in origins else "live"
        notice = ("Street routes from OSRM on OpenStreetMap data"
                  + (" (some from a cached response)" if mode == "cached" else "")
                  + ". Green and quiet scores are proxies from OSM parks and major roads, "
                    "not measured greenery or noise.")
    if worded:
        notice += " Explanations were worded by an AI model from these facts only."
    return {
        "contract_version": CONTRACT_VERSION,
        "mode": mode,
        "notice": notice,
        "generated_at": datetime.now(timezone.utc).astimezone().isoformat(timespec="seconds"),
        "preferences": {
            "interests": prefs.interests, "travel_mode": prefs.travel_mode,
            "max_duration_s": prefs.max_duration_s,
            "priorities": {"quiet": prefs.quiet, "green": prefs.green},
            "interpreted_by": prefs.interpreted_by,
        },
        "routes": routes,
        "sources": _sources(origins),
    }
