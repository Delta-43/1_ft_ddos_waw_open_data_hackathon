"""Green and quiet proxy scores for a route line (0-1, higher is better).

Both are proxies from OSM geometry, not measurements:
- green: share of the route inside, or within GREEN_BUFFER_M of, an OSM park or named garden.
- quiet: mean distance from motorway/trunk/primary/secondary roads, capped per road class.
"""
import math
from functools import cache

from app.services import osm_context

SAMPLE_STEP_M = 25
GREEN_BUFFER_M = 20
# Distance at which a road of this class stops counting against quiet.
ROAD_REACH_M = {"motorway": 300, "trunk": 250, "primary": 200, "secondary": 120}

LAT0 = 52.22
M_PER_DEG_LAT = 110_540
M_PER_DEG_LON = 111_320 * math.cos(math.radians(LAT0))

GREEN_METHOD = (
    f"Share of the route inside or within {GREEN_BUFFER_M} m of an OpenStreetMap park or named "
    "garden, sampled every 25 m. A greenery proxy: not tree canopy, shade or measured vegetation."
)
QUIET_METHOD = (
    "Mean distance from OpenStreetMap motorway, trunk, primary and secondary roads, capped at "
    "120-300 m by road class and scaled to 0-1. A traffic-exposure proxy: not measured noise."
)


def project(lon: float, lat: float) -> tuple[float, float]:
    return ((lon - 21.0) * M_PER_DEG_LON, (lat - LAT0) * M_PER_DEG_LAT)


def line_length_m(coordinates: list[list[float]]) -> float:
    pts = [project(*c) for c in coordinates]
    return sum(math.dist(a, b) for a, b in zip(pts, pts[1:]))


def sample(coordinates: list[list[float]], step: float = SAMPLE_STEP_M) -> list[tuple[float, float]]:
    pts = [project(*c) for c in coordinates]
    out = [pts[0]]
    carry = 0.0
    for a, b in zip(pts, pts[1:]):
        seg = math.dist(a, b)
        pos = step - carry
        while pos <= seg:
            t = pos / seg
            out.append((a[0] + t * (b[0] - a[0]), a[1] + t * (b[1] - a[1])))
            pos += step
        carry = (carry + seg) % step
    return out


def _bbox(points, margin=0.0):
    xs, ys = [p[0] for p in points], [p[1] for p in points]
    return (min(xs) - margin, min(ys) - margin, max(xs) + margin, max(ys) + margin)


def _in_bbox(p, box) -> bool:
    return box[0] <= p[0] <= box[2] and box[1] <= p[1] <= box[3]


def _seg_dist(p, a, b) -> float:
    dx, dy = b[0] - a[0], b[1] - a[1]
    if dx == dy == 0:
        return math.dist(p, a)
    t = max(0.0, min(1.0, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / (dx * dx + dy * dy)))
    return math.dist(p, (a[0] + t * dx, a[1] + t * dy))


def _inside(p, ring) -> bool:
    inside = False
    for (x1, y1), (x2, y2) in zip(ring, ring[1:] + ring[:1]):
        if (y1 > p[1]) != (y2 > p[1]) and p[0] < x1 + (p[1] - y1) * (x2 - x1) / (y2 - y1):
            inside = not inside
    return inside


def _near_line(p, line, limit) -> bool:
    return any(_seg_dist(p, a, b) <= limit for a, b in zip(line, line[1:]))


@cache
def _parks():
    parks = []
    for park in osm_context.load()["parks"]:
        rings = [[project(*c) for c in ring] for ring in park["rings"]]
        parks.append((_bbox([p for r in rings for p in r], GREEN_BUFFER_M), rings))
    return parks


@cache
def _roads():
    roads = []
    for road in osm_context.load()["roads"]:
        line = [project(*c) for c in road["coordinates"]]
        reach = ROAD_REACH_M[road["highway"]]
        roads.append((_bbox(line, reach), line, reach))
    return roads


def is_green(p) -> bool:
    for box, rings in _parks():
        if _in_bbox(p, box) and any(
            _inside(p, r) or _near_line(p, r, GREEN_BUFFER_M) for r in rings
        ):
            return True
    return False


def quietness(p) -> float:
    """1 when no major road is within reach; 0 on the road."""
    worst = 1.0
    for box, line, reach in _roads():
        if _in_bbox(p, box):
            d = min(_seg_dist(p, a, b) for a, b in zip(line, line[1:]))
            worst = min(worst, d / reach)
    return worst


def score_line(coordinates: list[list[float]]) -> dict[str, float]:
    points = sample(coordinates)
    green = sum(is_green(p) for p in points) / len(points)
    quiet = sum(quietness(p) for p in points) / len(points)
    return {"green_score": round(green, 2), "quiet_score": round(quiet, 2)}
