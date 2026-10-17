from app.data.catalogue import load_places, osm_places_source, places_response


def test_load_places_maps_osm_categories_to_contract_categories():
    places = load_places()
    categories = {p["category"] for p in places}
    assert categories <= {"museum", "landmark", "park", "generic"}
    # the real sample has museums, parks/gardens, and galleries (-> generic)
    assert "museum" in categories
    assert "park" in categories
    assert "generic" in categories


def test_load_places_keeps_real_id_and_coordinates():
    places = load_places()
    museum = next(p for p in places if "Mauzoleum" in p["name"])
    assert museum["id"] == "osm:node/343292162"
    assert museum["longitude"] == 21.0236508
    assert museum["latitude"] == 52.2176184
    assert museum["category"] == "museum"


def test_load_places_sets_optional_fields_present_but_honest():
    places = load_places()
    for place in places:
        assert place["address"] is None  # not captured by the OSM query used
        assert place["summary"] is None
        assert place["source_id"] == "osm-places-demo"


def test_osm_places_source_timestamp_has_colon_offset():
    source = osm_places_source()
    assert source["retrieved_at"] == "2026-10-17T13:11:18+02:00"
    assert source["mode"] == "real"
    assert "openstreetmap.org" in source["attribution"].lower() or "OpenStreetMap" in source["attribution"]


def test_places_response_shape():
    response = places_response()
    assert response["contract_version"] == "1.0"
    assert response["mode"] == "cached"
    assert len(response["sources"]) == 1
    assert response["sources"][0]["id"] == "osm-places-demo"
    assert len(response["places"]) == 26
