from datetime import datetime

import pytest
from app.services.opening_hours import CLOSED, OPEN, UNKNOWN, status

SAT, SUN, MON = (datetime(2026, 10, d, 12, 0) for d in (17, 18, 19))


def at(day: datetime, hhmm: str) -> datetime:
    h, m = hhmm.split(":")
    return day.replace(hour=int(h), minute=int(m))


@pytest.mark.parametrize(
    ("text", "when", "expected"),
    [
        ("We-Su 10:00-17:00", SUN, OPEN),
        ("We-Su 10:00-17:00", MON, CLOSED),
        ("We-Su 10:00-17:00", at(SUN, "17:00"), CLOSED),  # closing minute is closed
        ("We-Su 10:00-17:00", at(SUN, "09:59"), CLOSED),
        ("Tu,We,Fr-Su 11:00-19:00; Th 11:00-20:00", SAT, OPEN),
        ("Tu,We,Fr-Su 11:00-19:00; Th 11:00-20:00", at(datetime(2026, 10, 15), "19:30"), OPEN),  # Thursday
        ("Mo off; Tu-We 09:00-16:00; Th-Sa 10:00-18:00; Su 10:00-16:00", MON, CLOSED),
        ("Mo off; Tu-We 09:00-16:00; Th-Sa 10:00-18:00; Su 10:00-16:00", SUN, OPEN),
        ("Mo-Fr 09:00-12:00,13:00-17:00", at(datetime(2026, 10, 19), "12:30"), CLOSED),
        ("Mo-Su 00:00-24:00", at(SUN, "23:59"), OPEN),
        ("Fr-Mo 10:00-18:00", SUN, OPEN),  # range wrapping the week end
        ("Tu-Sa 12:00-19:00", SUN, CLOSED),
        ("24/7", MON, OPEN),
        ("closed", SAT, CLOSED),
        ("Mo-Su 22:00-02:00", at(SUN, "01:00"), OPEN),
        ("10:00-18:00", SAT, OPEN),
    ],
)
def test_status(text, when, expected):
    assert status(text, when) == expected


@pytest.mark.parametrize(
    "text",
    [None, "", "   ", "Mo-Fr 09:00-17:00; PH off", "Jan-Mar Mo-Fr 09:00-17:00", "sunrise-sunset",
     "by appointment", "Mo-Fr", "Mo-Fr 25:00-26:00", "Mo-Fr 09:00-17:00 open"],
)
def test_unsupported_or_missing_is_unknown_never_guessed(text):
    assert status(text, SUN) == UNKNOWN


def test_quoted_comments_are_ignored():
    assert status('Mo-Su 10:00-18:00 "free entry on Sundays"', SUN) == OPEN
