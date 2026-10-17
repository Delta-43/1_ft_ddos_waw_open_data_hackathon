"""Request models for contract 1.0 (contracts/api.schema.json).

Models forbid unknown fields, so requests cannot carry user identifiers or profile data.
"""
from typing import Annotated, Literal

from pydantic import BaseModel, ConfigDict, Field, model_validator

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


PlaceId = Annotated[str, Field(min_length=1, max_length=200)]


class RouteRequest(Strict):
    query: str = Field(min_length=1, max_length=1000)
    preferences: Preferences | None = None
    # Refs #85: explicit destination and ordered stops. Resolved against the city
    # catalogue (app/db.py) and planned (app/services/planner.py) once #85 step 2 lands;
    # for now the backend validates shape and existence but does not yet route through them.
    destination_place_id: PlaceId | None = None
    via_place_ids: list[PlaceId] | None = Field(default=None, max_length=5)
    comment: str | None = Field(default=None, max_length=500)

    @model_validator(mode="after")
    def _check_itinerary(self) -> "RouteRequest":
        if self.via_place_ids is not None:
            if len(set(self.via_place_ids)) != len(self.via_place_ids):
                raise ValueError("via_place_ids must not contain duplicates")
            if self.destination_place_id is not None and self.destination_place_id in self.via_place_ids:
                raise ValueError("destination_place_id must not also appear in via_place_ids")
        return self
