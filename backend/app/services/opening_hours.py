"""Evaluate raw OSM `opening_hours` text for one moment.

Supports the common subset: weekday lists/ranges (Mo-Fr, Tu,We,Fr-Su), HH:MM-HH:MM ranges
(comma-separated), `off`/`closed`, `24/7`, and `;` rules where a later rule overrides earlier
ones for the same day. Anything else (public holidays, months, week numbers, sunrise, comments
with conditions) makes the answer "unknown": we never guess. Missing text is also "unknown".
"""
import re
from datetime import datetime

OPEN, CLOSED, UNKNOWN = "open", "closed", "unknown"
DAYS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"]
_DAY = r"(?:Mo|Tu|We|Th|Fr|Sa|Su)"
_DAYS_PART = rf"{_DAY}(?:-{_DAY})?(?:\s*,\s*{_DAY}(?:-{_DAY})?)*"
_RANGE = r"\d{1,2}:\d{2}-\d{1,2}:\d{2}"
_TIMES_PART = rf"{_RANGE}(?:\s*,\s*{_RANGE})*"
_RULE = re.compile(
    rf"^(?:(?P<days>{_DAYS_PART})\s*)?(?:(?P<times>{_TIMES_PART})|(?P<off>off|closed))?$",
    re.IGNORECASE,
)


class _Unsupported(Exception):
    pass


def _days(part: str | None) -> set[int]:
    if not part:
        return set(range(7))
    days: set[int] = set()
    for item in re.split(r"\s*,\s*", part.strip()):
        a, _, b = item.partition("-")
        start = DAYS.index(a.capitalize())
        end = DAYS.index(b.capitalize()) if b else start
        days |= {(start + i) % 7 for i in range((end - start) % 7 + 1)}
    return days


def _minutes(hhmm: str) -> int:
    h, m = hhmm.split(":")
    if int(h) > 24 or int(m) > 59:
        raise _Unsupported(hhmm)
    return int(h) * 60 + int(m)


def _ranges(part: str) -> list[tuple[int, int]]:
    out = []
    for item in re.split(r"\s*,\s*", part.strip()):
        a, b = item.split("-")
        out.append((_minutes(a), _minutes(b)))
    return out


def _within(minute: int, ranges: list[tuple[int, int]]) -> bool:
    for start, end in ranges:
        if start <= end:
            if start <= minute < end or (end == 24 * 60 and minute >= start):
                return True
        elif minute >= start or minute < end:  # overnight, e.g. 22:00-02:00
            return True
    return False


def status(text: str | None, when: datetime) -> str:
    """Return "open", "closed" or "unknown" for `when` (use the place's local time)."""
    if not text or not text.strip():
        return UNKNOWN
    cleaned = re.sub(r'"[^"]*"', "", text).strip()
    if cleaned.lower() == "24/7":
        return OPEN
    if cleaned.lower() in ("closed", "off"):
        return CLOSED
    weekday, minute = when.weekday(), when.hour * 60 + when.minute
    try:
        rules = [_parse(r.strip()) for r in cleaned.split(";") if r.strip()]  # validate every rule first
    except (_Unsupported, ValueError):
        return UNKNOWN
    state = CLOSED  # with explicit rules, a day no rule mentions is closed
    for days, ranges in rules:
        if weekday in days:
            state = OPEN if ranges is not None and _within(minute, ranges) else CLOSED
    return state


def _parse(rule: str) -> tuple[set[int], list[tuple[int, int]] | None]:
    """One rule -> (days, time ranges); ranges is None for `off`/`closed`."""
    match = _RULE.match(rule)
    if not match or not (match["days"] or match["times"] or match["off"]):
        raise _Unsupported(rule)
    if match["off"]:
        return _days(match["days"]), None
    if not match["times"]:
        raise _Unsupported(rule)  # days with no times: meaning unclear
    return _days(match["days"]), _ranges(match["times"])
