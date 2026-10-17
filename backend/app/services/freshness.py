"""Freshness guard for live-style feeds (vehicle positions, air-quality readings).

Warsaw open data and GTFS-based feeds can stop updating for a vehicle or station during
repairs, holdbacks or technical stops while the feed itself still answers 200. A response
is therefore never "live" just because the request worked: each record is judged by its
own timestamp. A gap above MAX_AGE_S (30 minutes) makes the record stale.

Rules for callers:
- Stale or unparseable records are never drawn or described as live. Show the last-update
  time, or drop the record. Unknown stays unknown.
- Never extrapolate or interpolate a position across a gap.
- A record dated in the future (clock skew above FUTURE_TOLERANCE_S) is not trusted either.
"""
from collections.abc import Iterable
from datetime import datetime
from typing import Any
from zoneinfo import ZoneInfo

MAX_AGE_S = 30 * 60
FUTURE_TOLERANCE_S = 5 * 60
WARSAW = ZoneInfo("Europe/Warsaw")


def parse_time(value: Any) -> datetime | None:
    """Parse a feed timestamp to an aware datetime. Naive times are Warsaw local time.

    Accepts "2026-10-17 13:00:00", ISO 8601, and the portal's short offset ("...+01").
    Returns None when the value is missing or unreadable.
    """
    if not isinstance(value, str) or not value.strip():
        return None
    text = value.strip().replace("Z", "+00:00")
    if len(text) > 3 and text[-3] in "+-" and text[-2:].isdigit() and ":" not in text[-6:]:
        text += ":00"  # "+01" -> "+01:00"
    try:
        parsed = datetime.fromisoformat(text)
    except ValueError:
        return None
    return parsed if parsed.tzinfo else parsed.replace(tzinfo=WARSAW)


def assess(value: Any, now: datetime, max_age_s: int = MAX_AGE_S) -> dict[str, Any]:
    """Judge one timestamp. `fresh` is True only for a readable time within max_age_s."""
    when = parse_time(value)
    if when is None:
        return {"updated_at": None, "age_s": None, "fresh": False, "reason": "no_timestamp"}
    age = round((now - when).total_seconds())
    if age < -FUTURE_TOLERANCE_S:
        reason = "timestamp_in_future"
    elif age > max_age_s:
        reason = "stale"
    else:
        reason = None
    return {"updated_at": when.isoformat(), "age_s": age, "fresh": reason is None, "reason": reason}


def split_live(
    records: Iterable[dict[str, Any]], time_key: str, now: datetime, max_age_s: int = MAX_AGE_S
) -> tuple[list[dict[str, Any]], list[dict[str, Any]]]:
    """Split records into (live, stale). Each record gains a `freshness` entry."""
    live, stale = [], []
    for record in records:
        checked = {**record, "freshness": assess(record.get(time_key), now, max_age_s)}
        (live if checked["freshness"]["fresh"] else stale).append(checked)
    return live, stale


def largest_gap_s(times: Iterable[Any]) -> int | None:
    """Longest gap in seconds between consecutive readable timestamps, or None if under two."""
    parsed = sorted(t for t in (parse_time(v) for v in times) if t)
    if len(parsed) < 2:
        return None
    return round(max((b - a).total_seconds() for a, b in zip(parsed, parsed[1:])))


def has_gap(times: Iterable[Any], max_gap_s: int = MAX_AGE_S) -> bool:
    """True when a series of updates skips more than max_gap_s anywhere."""
    gap = largest_gap_s(times)
    return gap is not None and gap > max_gap_s
