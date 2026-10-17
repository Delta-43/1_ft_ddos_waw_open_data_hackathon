"""Call the Warsaw 2076 MCP server with the official MCP Python client.

    MCP_URL=http://<tailscale-ip>:8001/mcp MCP_TOKEN=... python scripts/mcp_client_demo.py "a quiet museum outing"
"""
import asyncio
import json
import os
import sys

from mcp import ClientSession
from mcp.client.streamable_http import streamablehttp_client


async def main(query: str) -> None:
    url, token = os.environ["MCP_URL"], os.environ["MCP_TOKEN"]
    async with streamablehttp_client(url, headers={"Authorization": f"Bearer {token}"}) as (r, w, _):
        async with ClientSession(r, w) as session:
            await session.initialize()
            print("tools:", [t.name for t in (await session.list_tools()).tools])
            result = await session.call_tool("plan_outing", {"query": query, "travel_mode": "walk"})
            data = json.loads(result.content[0].text)
            print(f"mode={data['mode']}")
            for route in data["routes"]:
                m = route["metrics"]
                print(f"- {route['name']}: {m['distance_m']['value']:.0f} m, "
                      f"green {m['green_score']['value']:.2f}, quiet {m['quiet_score']['value']:.2f}")


asyncio.run(main(sys.argv[1] if len(sys.argv) > 1 else "A quiet green museum outing"))
