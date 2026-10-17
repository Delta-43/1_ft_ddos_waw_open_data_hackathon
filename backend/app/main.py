"""Connectivity starter. Route data is synthetic, not navigable."""
import json
from pathlib import Path

from fastapi import FastAPI
from pydantic import BaseModel, Field

ROOT = Path(__file__).resolve().parents[2]
app = FastAPI(title="Warsaw 2076")


class RouteRequest(BaseModel):
    query: str = Field(min_length=1, max_length=1000)


@app.get("/api/health")
def health():
    return {"status": "ok", "mode": "fixture"}


@app.post("/api/routes")
def routes(request: RouteRequest):
    # Replace with shared services; MCP must call those same services.
    return json.loads((ROOT / "data/fixtures/route-response.json").read_text())
