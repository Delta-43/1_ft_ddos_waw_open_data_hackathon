# Module ownership

Delta owns external routing, AI, and MCP adapters. Keep provider credentials server-side.

## Language models (AI-01)

- `llm.py`: one interface, `get_client(task).complete_json(...)`. OpenRouter is the only provider now. To add another, write a class with `complete_json` and add it to `PROVIDERS`.
- Settings are in `.env.example`. One `OPENROUTER_API_KEY` serves the whole backend; the frontend never sees it.
- Tasks: `interpret` (query to preferences) and `explain` (route wording). Each can use its own model through `LLM_MODEL_<TASK>`.
- Privacy: requests contain the query text and route facts, no identifiers. They are not logged. OpenRouter is told `data_collection: deny`.
- `env.py` loads the repository `.env` without an extra dependency.
