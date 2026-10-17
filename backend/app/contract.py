"""Request models for contract 1.0 (contracts/api.schema.json).

Models forbid unknown fields, so requests cannot carry user identifiers or profile data.
"""
from typing import Annotated, Literal

from pydantic import BaseModel, ConfigDict, Field

CONTRACT_VERSION = "1.0"
PlaceCategory = Literal["museum", "landmark", "park", "generic"]


class Strict(BaseModel):
    model_config = ConfigDict(extra="forbid")


class Point(Strict):
    longitude: float = Field(ge=-180, le=180)
    latitude: float = Field(ge=-90, le=90)


class Priorities(Strict):
    quiet: float | None = Field(default=None, ge=0, le=1)
    green: float | None = Field(default=None, ge=0, le=1)


class Preferences(Strict):
    interests: list[Annotated[str, Field(min_length=1, max_length=40)]] | None = Field(
        default=None, max_length=10
    )
    travel_mode: Literal["walk", "bike"] | None = None
    max_duration_s: int | None = Field(default=None, ge=900, le=28800)
    priorities: Priorities | None = None
    start: Point | None = None


class RouteRequest(Strict):
    query: str = Field(min_length=1, max_length=1000)
    preferences: Preferences | None = None
