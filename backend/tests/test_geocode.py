from app.data.geocode import Geocoder


def test_geocode_returns_cached_value_without_a_request(monkeypatch):
    def fail_if_called(*args, **kwargs):
        raise AssertionError("should not hit the network for a cached query")

    monkeypatch.setattr("app.data.geocode.httpx.get", fail_if_called)
    geocoder = Geocoder(cache={"Rynek Starego Miasta, Warszawa, Polska": {"longitude": 21.0122, "latitude": 52.2497}})

    result = geocoder.geocode("Rynek Starego Miasta, Warszawa, Polska")

    assert result == {"longitude": 21.0122, "latitude": 52.2497}


def test_geocode_caches_a_miss_so_it_is_not_retried(monkeypatch):
    calls = []

    class FakeResponse:
        status_code = 200

        def json(self):
            return []

    def fake_get(*args, **kwargs):
        calls.append(1)
        return FakeResponse()

    monkeypatch.setattr("app.data.geocode.httpx.get", fake_get)
    monkeypatch.setattr("app.data.geocode.time.sleep", lambda _: None)
    geocoder = Geocoder(cache={})

    first = geocoder.geocode("Nonexistent Address 999, Warszawa, Polska")
    second = geocoder.geocode("Nonexistent Address 999, Warszawa, Polska")

    assert first is None
    assert second is None
    assert len(calls) == 1
