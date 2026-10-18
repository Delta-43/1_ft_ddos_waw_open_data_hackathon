"""Language-model providers behind one small interface.

Services call `get_client(task)` and then `complete_json(...)`. They never see a
provider, key or model name. Add a provider by writing a class with
`complete_json` and registering it in PROVIDERS.

Settings (backend environment only, never VITE_ variables):
    LLM_PROVIDER         openrouter | none   (default: openrouter when a key is set)
    OPENROUTER_API_KEY   one key for the whole backend
    LLM_MODEL            default model for every task
    LLM_MODEL_<TASK>     optional per-task override, e.g. LLM_MODEL_EXPLAIN
    LLM_DATA_COLLECTION  deny (default) or allow. Free OpenRouter models only run with allow,
                         which lets the provider train on the prompt text
    LLM_TIMEOUT_S        per request, default 12

Requests carry the user's query text and route facts only: no identifiers.
They are not logged here. OpenRouter is asked to route only to providers that
do not collect prompts (provider.data_collection = deny) unless LLM_DATA_COLLECTION=allow
is set, which free models require.
"""
import json
import logging
import os
from typing import Any, Protocol

import httpx

DEFAULT_MODEL = "anthropic/claude-haiku-5.5"
OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"
log = logging.getLogger(__name__)


class LLMUnavailable(Exception):
    """No provider configured, or the provider failed. Callers fall back to rules."""


class LLMClient(Protocol):
    name: str
    model: str

    def complete_json(self, system: str, user: str, schema_name: str, schema: dict) -> dict: ...


class OpenRouterClient:
    name = "openrouter"

    def __init__(self, api_key: str, model: str, timeout_s: float, data_collection: str = "deny"):
        self.api_key, self.model, self.timeout_s = api_key, model, timeout_s
        self.data_collection = data_collection

    def complete_json(self, system: str, user: str, schema_name: str, schema: dict) -> dict:
        body: dict[str, Any] = {
            "model": self.model,
            "messages": [{"role": "system", "content": system}, {"role": "user", "content": user}],
            "response_format": {
                "type": "json_schema",
                "json_schema": {"name": schema_name, "strict": True, "schema": schema},
            },
            "provider": {"data_collection": self.data_collection, "require_parameters": True},
            "temperature": 0,
            "max_tokens": 800,
        }
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "X-Title": "Warsaw 2076 hackathon demo",
        }
        try:
            response = httpx.post(OPENROUTER_URL, json=body, headers=headers, timeout=self.timeout_s)
            response.raise_for_status()
            content = response.json()["choices"][0]["message"]["content"]
            return json.loads(content)
        except (httpx.HTTPError, KeyError, IndexError, TypeError, ValueError) as exc:
            # Status and type only: never log the prompt or the key.
            status = getattr(getattr(exc, "response", None), "status_code", None)
            log.warning("OpenRouter %s failed: %s %s", self.model, type(exc).__name__, status or "")
            raise LLMUnavailable(type(exc).__name__) from None


PROVIDERS = {"openrouter": (OpenRouterClient, "OPENROUTER_API_KEY")}


def get_client(task: str) -> LLMClient:
    """Raise LLMUnavailable when no provider is configured."""
    provider = os.environ.get("LLM_PROVIDER") or (
        "openrouter" if os.environ.get("OPENROUTER_API_KEY") else "none"
    )
    if provider == "none":
        raise LLMUnavailable("no provider configured")
    if provider not in PROVIDERS:
        raise LLMUnavailable(f"unknown LLM_PROVIDER {provider!r}")
    cls, key_var = PROVIDERS[provider]
    key = os.environ.get(key_var)
    if not key:
        raise LLMUnavailable(f"{key_var} is not set")
    model = (os.environ.get(f"LLM_MODEL_{task.upper()}") or os.environ.get("LLM_MODEL")
             or DEFAULT_MODEL)
    collection = "allow" if os.environ.get("LLM_DATA_COLLECTION", "").lower() == "allow" else "deny"
    return cls(key, model, float(os.environ.get("LLM_TIMEOUT_S", "12")), collection)
