"""MCP-01: Streamable HTTP MCP server over the same services the REST API uses.

Tools call planner.plan and app.db, so there is one route planner. Access needs a
bearer token (MCP_TOKEN, backend-only) and the server is meant for the restricted
Tailscale network: bind it to that address, never to a public interface.

Run:  MCP_TOKEN=... python -m app.adapters.mcp_server --host <tailscale-ip> --port 8001
Endpoint: http://<host>:8001/mcp
"""
import argparse
import hmac
import os
from typing import Literal

import uvicorn
from app import db
from app.adapters.env import load_env
from app.contract import Preferences, RouteRequest
from app.services import planner
from mcp.server.fastmcp import FastMCP
from mcp.server.transport_security import TransportSecuritySettings
from pydantic import ValidationError

INSTRUCTIONS = (
    "Warsaw 2076 plans a quiet, green museum outing in Warsaw. Call plan_outing with a short "
    "request to get candidate walking or cycling routes; green and quiet scores are labelled "
    "proxies and every response lists its data sources, so repeat their mode and date when you "
    "explain a result. Use search_places for the places catalogue and list_layers/get_layer for "
    "open-data map layers. Nothing about the user is stored."
)


def build_server(allowed_hosts: list[str] | None = None) -> FastMCP:
    security = TransportSecuritySettings(
        enable_dns_rebinding_protection=bool(allowed_hosts),
        allowed_hosts=allowed_hosts or [],
        allowed_origins=[],
    )
    mcp = FastMCP(
        "warsaw-2076",
        instructions=INSTRUCTIONS,
        stateless_http=True,
        json_response=True,
        transport_security=security,
    )

    @mcp.tool()
    def plan_outing(
        query: str,
        travel_mode: Literal["walk", "bike"] | None = None,
        max_duration_s: int | None = None,
        quiet: float | None = None,
        green: float | None = None,
        start_longitude: float | None = None,
        start_latitude: float | None = None,
    ) -> dict:
        """Plan candidate routes for an outing (contract 1.0 RouteResponse).

        quiet and green are 0..1 priorities; durations are seconds; coordinates are lon, lat.
        """
        priorities = {k: v for k, v in (("quiet", quiet), ("green", green)) if v is not None}
        start = None
        if start_longitude is not None and start_latitude is not None:
            start = {"longitude": start_longitude, "latitude": start_latitude}
        prefs = {
            k: v
            for k, v in (
                ("travel_mode", travel_mode),
                ("max_duration_s", max_duration_s),
                ("priorities", priorities or None),
                ("start", start),
            )
            if v is not None
        }
        try:
            request = RouteRequest(query=query, preferences=Preferences(**prefs) if prefs else None)
        except ValidationError as exc:
            raise ValueError(str(exc)) from exc
        return planner.plan(request)

    @mcp.tool()
    def search_places(
        category: Literal["museum", "landmark", "park", "generic"] | None = None,
        bbox: str | None = None,
        q: str | None = None,
        limit: int = 20,
    ) -> dict:
        """List catalogue places. bbox is min_lon,min_lat,max_lon,max_lat; q is a case-insensitive
        name/address match (1-100 characters, trimmed); limit 1..100."""
        box = _bbox(bbox)
        query = q.strip() if q else None
        if query is not None and not (1 <= len(query) <= 100):
            raise ValueError("q must be 1-100 characters after trimming")
        places, sources = db.query_places(category, box, max(1, min(limit, 100)), query)
        return {"places": places, "sources": sources}

    @mcp.tool()
    def list_layers() -> dict:
        """List open-data layers (air quality, AED, toilets, events) and their feature counts."""
        counts = db.layer_counts()
        return {"layers": [
            {"id": k, "label": label, "count": counts.get(k, 0)} for k, (_, label) in db.LAYERS.items()
        ]}

    @mcp.tool()
    def get_layer(
        layer: Literal["air_quality", "aed", "toilets", "events"],
        bbox: str | None = None,
        limit: int = 50,
    ) -> dict:
        """GeoJSON features (lon, lat) for one open-data layer, with source attribution."""
        features, sources = db.query_layer(layer, _bbox(bbox), max(1, min(limit, 500)))
        return {"type": "FeatureCollection", "features": features, "sources": sources}

    return mcp


def _bbox(value: str | None):
    if not value:
        return None
    try:
        lon0, lat0, lon1, lat1 = (float(v) for v in value.split(","))
    except ValueError:
        raise ValueError("bbox must be min_lon,min_lat,max_lon,max_lat") from None
    if lon0 > lon1 or lat0 > lat1:
        raise ValueError("bbox minimums must not exceed maximums")
    return lon0, lat0, lon1, lat1


class BearerAuth:
    """Pure ASGI check: every request needs `Authorization: Bearer <MCP_TOKEN>`."""

    def __init__(self, app, token: str):
        self.app = app
        self.expected = f"Bearer {token}".encode()

    async def __call__(self, scope, receive, send):
        if scope["type"] == "http":
            given = dict(scope["headers"]).get(b"authorization", b"")
            if not hmac.compare_digest(given, self.expected):
                await send({"type": "http.response.start", "status": 401,
                            "headers": [(b"content-type", b"application/json"),
                                        (b"www-authenticate", b"Bearer")]})
                await send({"type": "http.response.body", "body": b'{"error":"unauthorized"}'})
                return
        await self.app(scope, receive, send)


def build_app(token: str, allowed_hosts: list[str] | None = None):
    if not token:
        raise RuntimeError("MCP_TOKEN is required; refusing to serve MCP without authentication")
    return BearerAuth(build_server(allowed_hosts).streamable_http_app(), token)


def main() -> None:
    load_env()
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--host", required=True, help="Tailscale address, e.g. 100.x.y.z")
    parser.add_argument("--port", type=int, default=8001)
    args = parser.parse_args()
    extra = [h for h in os.environ.get("MCP_ALLOWED_HOSTS", "").split(",") if h]
    hosts = [f"{args.host}:{args.port}", *extra]
    uvicorn.run(build_app(os.environ.get("MCP_TOKEN", ""), hosts), host=args.host, port=args.port)


if __name__ == "__main__":
    main()
