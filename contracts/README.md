# Shared contract

Delta and Alban jointly approve changes here before either pair implements them.

- `GET /api/health` → `{ "status": "ok", "mode": "fixture" }` in the starter.
- `POST /api/routes` accepts `{ "query": "A quiet museum outing" }`; query is 1–1000 characters.
- Success response: `route.schema.json`; example: `../data/fixtures/route-response.json`.
- Invalid requests return HTTP 422 using FastAPI's standard `detail` validation response.
- Frontend must handle non-2xx responses and unreachable backend.
- GeoJSON is longitude, latitude. Future distances use metres and durations use seconds.
- Add filters, route metrics, timestamps, and source metadata by agreement; these are not implemented in the starter.
- Keep fixtures and backend checks updated in the same PR as contract changes.
- Privacy: requests carry no user identifiers or stored-profile references, and the backend does not persist request bodies. Any future personal context is sent per request with a scoped token and is never stored.

Onboarding: STACK.md and SETUP.md contain the shared prerequisites. No personal agent skills or private infrastructure are required. Fresh Saturday implementation must be validated separately from the reference scaffold.
