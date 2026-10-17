"""Candidate museum outings: one shared service for REST and MCP.

Code supplies every fact in the response: places and opening hours come from the
OSM snapshot, geometry from OSRM (or labelled straight lines), scores from
app.services.scoring. Explanations only restate those values.
"""
import json
import math
import re
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from functools import cache
from pathlib import Path
from zoneinfo import ZoneInfo

from app import db
from app.contract import CONTRACT_VERSION, RouteRequest
from app.data import catalogue
from app.services import ai, opening_hours, osm_context, routing, scoring

ROOT = Path(__file__).resolve().parents[3]
PLACES_SNAPSHOT = ROOT / "data/fixtures/osm-places-sample.json"

WARSAW = ZoneInfo("Europe/Warsaw")
FIRST_STOP_LEAD_S = 1800  # rough time to reach the first museum when filtering the pool
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


class InvalidItinerary(ValueError):
    """destination_place_id/via_place_ids (#85) don't resolve to real catalogue places."""


def _validate_itinerary(destination_place_id: str | None, via_place_ids: list[str] | None) -> None:
    """Resolve requested stop ids against the city catalogue; raise on any unknown id.
    Step 1 of #85: validation only. The route itself does not yet visit these stops
    (that's #85 step 2) - capabilities.ordered_stops in GET /api/health stays false
    until it does, so the frontend never assumes more than what actually ships."""
    ids = set(via_place_ids or [])
    if destination_place_id:
        ids.add(destination_place_id)
    if not ids:
        return
    missing = ids - db.places_by_ids(ids).keys()
    if missing:
        raise InvalidItinerary(f"Unknown place id(s): {', '.join(sorted(missing))}")


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


def clock() -> datetime:
    """Departure time for opening-hours checks: now, in Warsaw. Tests replace this."""
    return datetime.now(WARSAW)


def museums(interests: list[str], when: datetime | None = None) -> list[dict]:
    """Candidate museums. With `when`, drop those whose OSM hours say closed at that time;
    unknown hours are kept. If that would leave none, keep all so a route still exists."""
    raws = [r for r in _snapshot()["places"] if r["category"] in ("museum", "gallery") and _usable(r)]
    if when is not None:
        open_now = [r for r in raws if opening_hours.status(r.get("opening_hours"), when) != "closed"]
        raws = open_now or raws
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


def candidate_stops(start, prefs: Interpreted, when: datetime | None = None) -> list[tuple[str, str, list[dict]]]:
    budget = prefs.max_duration_s or 10800
    count = max(1, min(3, (budget - 2700) // MUSEUM_VISIT_S))
    pool = museums(prefs.interests, when)
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


def _build_route(key: str, name: str, start, stops: list[dict], prefs: Interpreted) -> tuple[dict, str, float]:
    """One route's geometry, metrics and stop timing, plus its geometry origin
    ("live"/"cached"/"straight_line", for the caller's `sources` and `mode`) and total
    elapsed time including visits (travel `duration_s` alone excludes those). Shared by
    the museum-outing candidates and #85's explicit-itinerary route; `_utility` is popped
    by the caller once ranking is decided."""
    coords, distance, duration, legs, origin = _geometry(prefs.travel_mode, start, stops)
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
    return route, origin, offset


def _resolve_itinerary_stops(destination_place_id: str, via_place_ids: list[str] | None) -> list[dict]:
    """Ordered Place dicts for #85's explicit itinerary: via stops in the given order,
    then the destination. Ids are already known-good - _validate_itinerary runs first."""
    ids = [*(via_place_ids or []), destination_place_id]
    found = db.places_by_ids(set(ids))
    return [found[i] for i in ids]


def _explain_itinerary(route: dict, prefs: Interpreted) -> str:
    """Unlike _explain, names every stop regardless of category - an explicit
    itinerary (#85) can include landmarks and generic places, not just museums/parks."""
    m = route["metrics"]
    names = [p["name"] for p in route["places"]]
    via, destination = names[:-1], names[-1]
    minutes = round(m["duration_s"]["value"] / 60)
    verb = "walking" if prefs.travel_mode == "walk" else "cycling"
    text = f"Visits {', '.join(via)} on the way to {destination}" if via else f"Goes directly to {destination}"
    text += f"; {m['distance_m']['value'] / 1000:.1f} km, about {minutes} min {verb}."
    text += f" Green proxy {m['green_score']['value']:.2f}, quiet proxy {m['quiet_score']['value']:.2f}."
    return text


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


def _hours_note(route: dict, departure: datetime, categories: set[str] | None = {"museum"}) -> str:
    """Sentence on opening hours at each stop's estimated arrival (OSM text, may be incomplete).
    `categories=None` checks every stop regardless of category - used for #85's explicit
    itinerary, since the user chose these stops themselves and any of them (a garden, a
    ruin) may carry a real opening_hours tag. The museum-outing candidates keep the
    original museum-only check: parks there are the planner's own detour picks, not a
    user-named destination, so their hours were never part of this note's contract."""
    by_id = {p["id"]: p for p in route["places"]}
    closed, unknown = [], []
    for stop in route["stops"]:
        place = by_id[stop["place_id"]]
        if categories is not None and place["category"] not in categories:
            continue
        arrival = departure + timedelta(seconds=stop["arrival_offset_s"])
        result = opening_hours.status(place["opening_hours"], arrival)
        if result == "closed":
            closed.append(f'{place["name"]} ({arrival:%H:%M})')
        elif result == "unknown":
            unknown.append(place["name"])
    note = ""
    if closed:
        note += " Opening hours in OpenStreetMap say closed on arrival: " + ", ".join(closed) + "."
    if unknown:
        note += " Opening hours not known for: " + ", ".join(unknown) + "."
    return note


def _utility(route: dict, prefs: Interpreted, total_s: float) -> float:
    m = route["metrics"]
    weight = (prefs.quiet + prefs.green) or 1
    score = (prefs.quiet * m["quiet_score"]["value"] + prefs.green * m["green_score"]["value"]) / weight
    score -= 0.05 * m["duration_s"]["value"] / 3600
    if prefs.max_duration_s and total_s > prefs.max_duration_s:
        score -= 1
    return score


def _sources(origins: set[str], is_itinerary: bool = False) -> list[dict]:
    places, ctx = _snapshot(), osm_context.load()
    sources = [
        {"id": "osm-places", "name": "OpenStreetMap museums, galleries and parks", "mode": "real",
         "attribution": places["attribution"], "url": "https://www.openstreetmap.org/copyright",
         "retrieved_at": places["fetched_at"].replace("+0200", "+02:00"), "data_date": None,
         "method": "Overpass snapshot of the Ujazdow and Lazienki area; opening hours are raw OSM text, checked against Warsaw time for the planned arrival where the text is readable."},
        {"id": "green-proxy", "name": "Greenery proxy from OSM parks", "mode": "proxy",
         "attribution": ctx["attribution"], "url": "https://www.openstreetmap.org/copyright",
         "retrieved_at": ctx["fetched_at"], "data_date": None, "method": scoring.GREEN_METHOD},
        {"id": "quiet-proxy", "name": "Traffic-exposure proxy from OSM major roads", "mode": "proxy",
         "attribution": ctx["attribution"], "url": "https://www.openstreetmap.org/copyright",
         "retrieved_at": ctx["fetched_at"], "data_date": None, "method": scoring.QUIET_METHOD},
    ]
    if is_itinerary:
        # #85: destination/via stops are resolved against the city catalogue (app/db.py),
        # which carries its own source id - distinct from the osm-places snapshot above
        # that the museum-outing candidates read directly from the fixture.
        sources.append(catalogue.osm_places_source())
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
    _validate_itinerary(request.destination_place_id, request.via_place_ids)
    prefs = interpret(request)
    departure = clock()
    start_pt = request.preferences.start if request.preferences and request.preferences.start else None
    start = (start_pt.longitude, start_pt.latitude) if start_pt else DEFAULT_START
    is_itinerary = request.destination_place_id is not None
    routes, origins = [], set()
    itinerary_total_s = None
    if is_itinerary:
        # #85 step 2: the user named exact stops, so plan one route that visits them
        # in the given order and ends at the destination - never a museum template.
        stops = _resolve_itinerary_stops(request.destination_place_id, request.via_place_ids)
        route, origin, itinerary_total_s = _build_route("itinerary", "Your requested itinerary", start, stops, prefs)
        origins.add(origin)
        routes.append(route)
    else:
        for key, name, stops in candidate_stops(start, prefs, departure + timedelta(seconds=FIRST_STOP_LEAD_S)):
            route, origin, _ = _build_route(key, name, start, stops, prefs)
            origins.add(origin)
            routes.append(route)
    routes.sort(key=lambda r: r.pop("_utility"), reverse=True)
    baseline = next((r for r in routes if r["id"] == "direct"), None)
    for rank, route in enumerate(routes, start=1):
        route["rank"] = rank
        route["recommended"] = rank == 1
        route["explanation"] = (
            _explain_itinerary(route, prefs) if is_itinerary else _explain(route["name"], route, prefs, baseline)
        )
    worded = ai.model_explanations(request.query, routes)
    for route in routes:
        route["explanation"] = worded.get(route["id"], route["explanation"])
        route["explanation"] += _hours_note(route, departure, categories=None if is_itinerary else {"museum"})
    # #85 step 3: an explicit itinerary isn't dropped or rejected just for running long -
    # it's reported honestly, same spirit as _hours_note never guessing instead of hiding.
    if is_itinerary and prefs.max_duration_s and itinerary_total_s > prefs.max_duration_s:
        over_min = round((itinerary_total_s - prefs.max_duration_s) / 60)
        routes[0]["explanation"] += (
            f" This itinerary takes about {round(itinerary_total_s / 60)} min including stops, "
            f"{over_min} min over the requested {round(prefs.max_duration_s / 60)} min budget."
        )
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
    if is_itinerary:
        notice += (" Visits the requested destination and stops, in the order given. Closed or "
                   "unknown opening hours and an exceeded time budget are reported in the "
                   "explanation, not silently dropped - but the backend still returns the "
                   "itinerary rather than refusing it outright.")
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
        "sources": _sources(origins, is_itinerary),
        # #85 step 4: lets the UI confirm the backend honoured its own request, rather
        # than guessing from route names. Always exactly request.destination_place_id/
        # via_place_ids, never substituted - null when there was no explicit itinerary.
        "applied_itinerary": (
            {"destination_place_id": request.destination_place_id, "via_place_ids": list(request.via_place_ids or [])}
            if is_itinerary else None
        ),
    }
