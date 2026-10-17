from app.data.warsaw_open_data import (
    normalise_aed,
    normalise_air_quality,
    normalise_events,
    normalise_toilets,
)

SAMPLE_STATION = {
    "station": "ul. Grochowska",
    "name": "Warszawa-Grochowska",
    "lon": 21.080555,
    "lat": 52.245703,
    "ijp": {"name": "Bardzo dobry"},
    "data": [{"param_code": "PM10", "value": 9.67, "unit": "ug/m3", "time": "2026-10-17 13:00:00"}],
}

SAMPLE_AED = {
    "geometry": {"type": "Point", "coordinates": [[21.0148, 52.2086]]},
    "properties": {
        "defibrillator_id": "622",
        "location_object_name": "Urzad Dzielnicy Mokotow",
        "device_public_access": "Publiczny",
        "device_access_description": "Pn-Pt 8:00-16:00",
    },
}

SAMPLE_TOILET = {
    "type": "Feature",
    "geometry": {"type": "Point", "coordinates": [20.9896, 52.2635]},
    "properties": {"lokalizacja": "Biblioteka Publiczna", "dzielnica": "Zoliborz", "godziny": "09:00-19:00", "platnosc": 0},
}

SAMPLE_EVENT_WITH_MAP = {
    "address": [{"name": "OCH-Teatr"}],
    "category": [{"name": "Kultura"}],
    "map": {"features": [{"geometry": {"coordinates": [20.98, 52.2142]}}]},
    "occurrence": [{"from": "2027-01-29T19:00:00+01", "to": "2027-01-29T21:00:00+01"}],
}

SAMPLE_EVENT_WITHOUT_MAP = {
    "address": [{"name": "Unknown venue"}],
    "category": [{"name": "Kultura"}],
    "map": {"features": []},
    "occurrence": [{}],
}


def test_normalise_air_quality_keeps_station_and_measurements():
    places = normalise_air_quality([SAMPLE_STATION])
    assert places[0]["id"] == "waw:air-quality/ul. Grochowska"
    assert places[0]["longitude"] == 21.080555
    assert places[0]["measurements"][0]["param"] == "PM10"


def test_normalise_aed_unwraps_nested_coordinate_array():
    places = normalise_aed([SAMPLE_AED])
    assert places[0]["id"] == "waw:aed/622"
    assert places[0]["longitude"] == 21.0148
    assert places[0]["latitude"] == 52.2086


def test_normalise_toilets_synthesises_id_from_index():
    places = normalise_toilets([SAMPLE_TOILET])
    assert places[0]["id"] == "waw:toilet/0"
    assert places[0]["free"] is True


def test_normalise_events_drops_records_without_map_coordinates():
    places = normalise_events([SAMPLE_EVENT_WITH_MAP, SAMPLE_EVENT_WITHOUT_MAP])
    assert len(places) == 1
    assert places[0]["name"] == "OCH-Teatr"
    assert places[0]["starts_at"] == "2027-01-29T19:00:00+01"
