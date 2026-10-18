"""Warm data/fixtures/osrm-cache for every candidate the default start can produce.

Candidates depend only on interests, travel mode and museum count, so this covers
every query sent without an explicit start. Run before the pitch:
    PYTHONPATH=backend python -m app.services.demo_cache
"""
import itertools

from app.services import planner, routing, tracks


def main() -> None:
    routing.LOCAL_CACHE = routing.DEMO_CACHE
    urls = set()
    for interest, mode, hours in itertools.product(("museums", "art"), ("walk", "bike"), (2, 3, 4)):
        prefs = planner.Interpreted([interest], mode, hours * 3600, 0.5, 0.5)
        for _, _, stops in planner.candidate_stops(planner.DEFAULT_START, prefs):
            waypoints = [planner.DEFAULT_START] + [(s["longitude"], s["latitude"]) for s in stops]
            url = routing.route_url(mode, waypoints)
            if url not in urls:
                urls.add(url)
                routing.street_route(mode, waypoints)
    for track in tracks.load():
        stops = planner._resolve_itinerary_stops(track["destination_place_id"], track["via_place_ids"])
        waypoints = [planner.DEFAULT_START] + [(s["longitude"], s["latitude"]) for s in stops]
        url = routing.route_url(track["travel_mode"], waypoints)
        if url not in urls:
            urls.add(url)
            routing.street_route(track["travel_mode"], waypoints)
    print(f"{len(urls)} routes cached in {routing.DEMO_CACHE}")


if __name__ == "__main__":
    main()
