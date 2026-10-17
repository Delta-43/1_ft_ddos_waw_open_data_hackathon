from app.data.osm_places import normalise

SAMPLE_ELEMENTS = [
    {
        "type": "node",
        "id": 343292162,
        "lat": 52.2176184,
        "lon": 21.0236508,
        "tags": {"tourism": "museum", "name": "Mauzoleum Walki i Meczenstwa", "opening_hours": "We-Su 10:00-17:00"},
    },
    {
        "type": "way",
        "id": 5081164,
        "center": {"lat": 52.2155, "lon": 21.0335},
        "tags": {"leisure": "park", "name": "Park Ujazdowski"},
    },
    {
        "type": "way",
        "id": 999999,
        "center": {"lat": 52.21, "lon": 21.03},
        "tags": {"leisure": "garden"},
    },
]


def test_normalise_keeps_only_named_elements():
    places = normalise(SAMPLE_ELEMENTS)
    assert len(places) == 2


def test_normalise_preserves_osm_id_name_and_coordinates():
    places = normalise(SAMPLE_ELEMENTS)
    museum = next(p for p in places if p["category"] == "museum")
    assert museum["id"] == "osm:node/343292162"
    assert museum["name"] == "Mauzoleum Walki i Meczenstwa"
    assert museum["longitude"] == 21.0236508
    assert museum["latitude"] == 52.2176184
    assert museum["opening_hours"] == "We-Su 10:00-17:00"


def test_normalise_uses_center_for_ways():
    places = normalise(SAMPLE_ELEMENTS)
    park = next(p for p in places if p["category"] == "park")
    assert park["id"] == "osm:way/5081164"
    assert park["longitude"] == 21.0335
    assert park["latitude"] == 52.2155
