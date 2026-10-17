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


HISTORIC_ELEMENTS = [
    {
        "type": "way",
        "id": 28363553,
        "center": {"lat": 52.2197, "lon": 21.0307},
        "tags": {"historic": "castle", "name": "Zamek Ujazdowski"},
    },
    {
        "type": "node",
        "id": 343249439,
        "lat": 52.2143,
        "lon": 21.0317,
        "tags": {"historic": "memorial", "name": "Ignacy Jan Paderewski"},
    },
    {
        "type": "way",
        "id": 30871838,
        "center": {"lat": 52.219, "lon": 21.028},
        "tags": {"historic": "yes", "name": "Kancelaria Prezesa Rady Ministrow"},
    },
    {
        "type": "node",
        "id": 1448330230,
        "lat": 52.2155,
        "lon": 21.0355,
        "tags": {"historic": "memorial", "tourism": "artwork", "name": "Fryderyk Chopin"},
    },
]


def test_normalise_keeps_substantial_historic_values():
    places = normalise(HISTORIC_ELEMENTS)
    castle = next(p for p in places if p["name"] == "Zamek Ujazdowski")
    assert castle["category"] == "castle"


def test_normalise_drops_memorial_and_yes_historic_values_without_a_tourism_tag():
    places = normalise(HISTORIC_ELEMENTS)
    names = {p["name"] for p in places}
    assert "Ignacy Jan Paderewski" not in names
    assert "Kancelaria Prezesa Rady Ministrow" not in names


def test_normalise_keeps_historic_memorial_when_also_tagged_tourism():
    places = normalise(HISTORIC_ELEMENTS)
    chopin = next(p for p in places if p["name"] == "Fryderyk Chopin")
    assert chopin["category"] == "artwork"  # tourism tag takes priority over historic
