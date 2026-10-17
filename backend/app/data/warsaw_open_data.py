"""Fetch and normalise a handful of official Warsaw open-data datasets.

Catalogue discovery (dane.um.warszawa.pl/catalogue → /api/datasets) needs no
key. Every dataset resource does: POST to /api/action/<endpoint> with a raw
`Authorization: <token>` header (not "Bearer <token>"). The token lives in
.env as DANE_WWA_API_KEY and is never committed or logged.

Of the 23 catalogued datasets, five fit a quiet/green museum-and-park outing
and stay inside Sonia's place/data ownership (not routing or transit, which
are Delta's): air quality (environmental score input), AED locations,
public toilets, the cultural events calendar, and open sports fields. See
docs/DATA.md for the full 23-dataset catalogue, including datasets
intentionally not fetched here.

Open sports fields has no coordinates in the source, only a street address,
so it is geocoded via OSM Nominatim (see geocode.py) rather than skipped.
That lookup is slow (~300 addresses, rate-limited to 1/second per Nominatim's
usage policy) and network-dependent, so it is excluded from
fetch_and_normalise_all() by default; call normalise_sports_fields()
explicitly, or pass include_sports_fields=True, when you want it.

Run as a script to fetch a fresh sample of the four fast datasets and print
a summary:
    DANE_WWA_API_KEY=... python -m app.data.warsaw_open_data
Add --sports-fields to also geocode and fetch open sports fields (slow):
    DANE_WWA_API_KEY=... python -m app.data.warsaw_open_data --sports-fields
"""
import json
import os
import sys
import time
from pathlib import Path
from typing import Any

import httpx
from app.data.geocode import ATTRIBUTION as OSM_ATTRIBUTION
from app.data.geocode import Geocoder, GeocodingUnavailable

ROOT = Path(__file__).resolve().parents[3]
LOCAL_CACHE = ROOT / "data/local/warsaw_open_data_raw.json"
BASE_URL = "https://dane.um.warszawa.pl/api/action"

ATTRIBUTION = "Urząd m.st. Warszawy, https://dane.um.warszawa.pl/ (Creative Commons Attribution)"

ENDPOINTS = {
    "air_quality": "get_bopipk_monitoring_jakosci_powietrza",
    "aed": "get_scb_lokalizacja_defibrylatorow",
    "toilets": "get_m_toalety",
    "events": "get_bmm_kalendarz_wydarzen",
}

SPORTS_FIELDS_ENDPOINT = "get_be_otwarte_boiska"


def _token() -> str:
    token = os.environ.get("DANE_WWA_API_KEY")
    if not token:
        raise RuntimeError("DANE_WWA_API_KEY is not set; copy .env.example to .env and add a key")
    return token


def fetch_action(endpoint: str, attempts: int = 3) -> Any:
    """Bounded retries against a single official endpoint."""
    url = f"{BASE_URL}/{endpoint}"
    headers = {"Authorization": _token()}
    last_error: Exception | None = None
    for _ in range(attempts):
        try:
            response = httpx.post(url, headers=headers, timeout=20)
        except httpx.HTTPError as exc:
            last_error = exc
            time.sleep(3)
            continue
        if response.status_code == 200:
            return response.json()
        last_error = RuntimeError(f"{endpoint} returned HTTP {response.status_code}: {response.text[:200]}")
        time.sleep(3)
    raise RuntimeError(f"Warsaw open data fetch failed for {endpoint}: {last_error}")


def normalise_air_quality(stations: list[dict[str, Any]]) -> list[dict[str, Any]]:
    places = []
    for station in stations:
        places.append(
            {
                "id": f"waw:air-quality/{station['station']}",
                "name": station.get("name"),
                "longitude": station.get("lon"),
                "latitude": station.get("lat"),
                "category": "air_quality_station",
                "overall_index": (station.get("ijp") or {}).get("name"),
                "measurements": [
                    {"param": m.get("param_code"), "value": m.get("value"), "unit": m.get("unit"), "time": m.get("time")}
                    for m in station.get("data", [])
                ],
                "source": "warsaw_open_data",
                "attribution": ATTRIBUTION,
            }
        )
    return places


def normalise_aed(features: list[dict[str, Any]]) -> list[dict[str, Any]]:
    places = []
    for feature in features:
        props = feature.get("properties", {})
        coords = (feature.get("geometry") or {}).get("coordinates") or [[None, None]]
        lon, lat = coords[0] if isinstance(coords[0], list) else coords
        places.append(
            {
                "id": f"waw:aed/{props.get('defibrillator_id')}",
                "name": props.get("location_object_name") or props.get("location_street"),
                "longitude": lon,
                "latitude": lat,
                "category": "aed",
                "access": props.get("device_public_access"),
                "access_hours": props.get("device_access_description"),
                "source": "warsaw_open_data",
                "attribution": ATTRIBUTION,
            }
        )
    return places


def normalise_toilets(features: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """The source has no stable per-record id; index position is used and
    documented as synthetic, not an upstream identifier."""
    places = []
    for index, feature in enumerate(features):
        props = feature.get("properties", {})
        lon, lat = (feature.get("geometry") or {}).get("coordinates", [None, None])
        places.append(
            {
                "id": f"waw:toilet/{index}",
                "name": props.get("lokalizacja"),
                "longitude": lon,
                "latitude": lat,
                "category": "toilet",
                "district": props.get("dzielnica"),
                "opening_hours": props.get("godziny"),
                "free": (props.get("platnosc") == 0) if props.get("platnosc") is not None else None,
                "source": "warsaw_open_data",
                "attribution": ATTRIBUTION,
            }
        )
    return places


def normalise_events(events: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """Only events with a resolvable map point are kept; the rest lack
    coordinates and are dropped rather than placed at a guessed location."""
    places = []
    for index, event in enumerate(events):
        features = ((event.get("map") or {}).get("features")) or []
        if not features:
            continue
        lon, lat = features[0]["geometry"]["coordinates"]
        occurrence = (event.get("occurrence") or [{}])[0]
        places.append(
            {
                "id": f"waw:event/{index}",
                "name": (event.get("address") or [{}])[0].get("name"),
                "longitude": lon,
                "latitude": lat,
                "category": "event",
                "event_category": [c.get("name") for c in event.get("category", [])],
                "starts_at": occurrence.get("from"),
                "ends_at": occurrence.get("to"),
                "source": "warsaw_open_data",
                "attribution": ATTRIBUTION,
            }
        )
    return places


def normalise_sports_fields(records: list[dict[str, Any]], geocoder: Geocoder) -> list[dict[str, Any]]:
    """The source has street addresses but no coordinates. Each distinct
    (address, district) is geocoded once via Nominatim and shared across
    every record at that address (a school often hosts several pitch
    types). A record whose address cannot be geocoded is dropped, not
    placed at a guessed location.

    If Nominatim becomes persistently unavailable (rate-limited past the
    client's own retries) partway through, normalisation stops rather than
    treating every remaining address as "not found" — whatever was
    successfully geocoded before that point is still returned."""
    places = []
    for index, record in enumerate(records):
        address = record.get("Adres obiektu")
        district = record.get("Dzielnica")
        if not address:
            continue
        query = f"{address}, {district}, Warszawa, Polska" if district else f"{address}, Warszawa, Polska"
        try:
            coords = geocoder.geocode(query)
        except GeocodingUnavailable as exc:
            print(f"warsaw_open_data: stopping sports-field geocoding early ({exc})")
            break
        if coords is None:
            continue
        places.append(
            {
                "id": f"waw:sports-field/{index}",
                "name": record.get("Nazwa placówki oświatowej"),
                "longitude": coords["longitude"],
                "latitude": coords["latitude"],
                "category": "sports_field",
                "field_type": record.get("Typ obiektu"),
                "surface": record.get("Rodzaj nawierzchni"),
                "district": district,
                "address": address,
                "source": "warsaw_open_data",
                "attribution": ATTRIBUTION,
                "coordinate_source": "osm_nominatim",
                "coordinate_attribution": OSM_ATTRIBUTION,
            }
        )
    return places


NORMALISERS = {
    "air_quality": normalise_air_quality,
    "aed": normalise_aed,
    "toilets": normalise_toilets,
    "events": normalise_events,
}


def fetch_and_normalise_all(include_sports_fields: bool = False) -> dict[str, Any]:
    fetched_at = time.strftime("%Y-%m-%dT%H:%M:%S%z")
    result: dict[str, Any] = {
        "source_url": BASE_URL,
        "fetched_at": fetched_at,
        "licence": "Creative Commons Attribution",
        "attribution": ATTRIBUTION,
        "datasets": {},
    }
    for key, endpoint in ENDPOINTS.items():
        raw = fetch_action(endpoint)
        places = NORMALISERS[key](raw)
        result["datasets"][key] = {
            "endpoint": endpoint,
            "raw_record_count": len(raw),
            "normalised_count": len(places),
            "places": places,
        }
        time.sleep(1)

    if include_sports_fields:
        raw = fetch_action(SPORTS_FIELDS_ENDPOINT)
        geocoder = Geocoder()
        try:
            places = normalise_sports_fields(raw, geocoder)
        finally:
            geocoder.save()
        result["datasets"]["sports_fields"] = {
            "endpoint": SPORTS_FIELDS_ENDPOINT,
            "raw_record_count": len(raw),
            "normalised_count": len(places),
            "places": places,
        }

    return result


if __name__ == "__main__":
    include_sports_fields = "--sports-fields" in sys.argv
    result = fetch_and_normalise_all(include_sports_fields=include_sports_fields)
    LOCAL_CACHE.parent.mkdir(parents=True, exist_ok=True)
    LOCAL_CACHE.write_text(json.dumps(result, indent=2, ensure_ascii=False))
    for key, dataset in result["datasets"].items():
        print(f"{key}: {dataset['raw_record_count']} raw -> {dataset['normalised_count']} normalised ({dataset['endpoint']})")
    print(f"Fetched at {result['fetched_at']}; cached to {LOCAL_CACHE}")
