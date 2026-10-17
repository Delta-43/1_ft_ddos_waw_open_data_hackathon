from datetime import datetime, timedelta

from app.services import freshness
from app.services.freshness import WARSAW, assess, has_gap, largest_gap_s, parse_time, split_live

NOW = datetime(2026, 10, 17, 14, 0, tzinfo=WARSAW)


def ago(minutes: float) -> str:
    return (NOW - timedelta(minutes=minutes)).strftime("%Y-%m-%d %H:%M:%S")


def test_parse_accepts_portal_formats():
    assert parse_time("2026-10-17 13:00:00") == datetime(2026, 10, 17, 13, 0, tzinfo=WARSAW)
    assert parse_time("2026-10-17T19:00:00+01") == parse_time("2026-10-17T19:00:00+01:00")
    assert parse_time("2026-10-17T11:00:00Z") == parse_time("2026-10-17 13:00:00")
    for bad in (None, "", "n/a", "2026-13-45 99:00:00", 12):
        assert parse_time(bad) is None


def test_thirty_minute_boundary():
    assert assess(ago(29), NOW)["fresh"] is True
    assert assess(ago(30), NOW)["fresh"] is True  # exactly 30 min is still within the limit
    stale = assess(ago(31), NOW)
    assert stale["fresh"] is False and stale["reason"] == "stale"


def test_missing_and_future_timestamps_are_not_fresh():
    assert assess(None, NOW)["reason"] == "no_timestamp"
    assert assess("garbage", NOW)["fresh"] is False
    assert assess(ago(-4), NOW)["fresh"] is True  # small clock skew tolerated
    assert assess(ago(-10), NOW)["reason"] == "timestamp_in_future"


def test_summer_time_offset_is_respected():
    # 2026-10-17 is CEST (+02:00). 11:50Z is 13:50 local, 10 minutes before NOW.
    assert assess("2026-10-17T11:50:00Z", NOW)["age_s"] == 600


def test_split_live_drops_vehicles_that_stopped_updating():
    vehicles = [
        {"id": "bus-1", "updated": ago(2)},
        {"id": "tram-2", "updated": ago(95)},  # technical stop: feed answers, vehicle silent
        {"id": "bus-3", "updated": None},
    ]
    live, stale = split_live(vehicles, "updated", NOW)
    assert [v["id"] for v in live] == ["bus-1"]
    assert {v["id"] for v in stale} == {"tram-2", "bus-3"}
    assert all("freshness" in v for v in live + stale)


def test_gap_detection():
    times = [ago(90), ago(80), ago(20), ago(10)]  # 60-minute hole in the middle
    assert largest_gap_s(times) == 3600
    assert has_gap(times) is True
    assert has_gap([ago(30), ago(20), ago(5)]) is False
    assert largest_gap_s([ago(1)]) is None and has_gap([]) is False
    assert freshness.MAX_AGE_S == 1800
