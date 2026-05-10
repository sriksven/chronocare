"""Multi-model LLM client: OpenAI (GPT-4o / GPT-4o mini) + Groq (Llama-3.3-70b).

Routing by backend:
  "groq"       → llama-3.3-70b-versatile  (fast structured output)
  "openai"     → gpt-4o                   (deep reasoning + narrative)
  "openai-mini"→ gpt-4o-mini              (cost-efficient guideline matching)

Temperature convention:
  - analysis=True  → 0.2 (reasoning steps: reproducibility matters)
  - analysis=False → 0.5 (narrative steps: readable prose matters)
"""

from __future__ import annotations

import json
import time
from typing import Any, Literal

import structlog
from groq import Groq, RateLimitError as GroqRateLimitError, APIError as GroqAPIError
from openai import OpenAI, RateLimitError as OpenAIRateLimitError, APIError as OpenAIAPIError

Backend = Literal["groq", "openai", "openai-mini"]

_MODELS: dict[Backend, str] = {
    "groq": "llama-3.3-70b-versatile",
    "openai": "gpt-4o",
    "openai-mini": "gpt-4o-mini",
}

_MAX_RETRIES = 3
_BACKOFF_BASE = 1.5

log = structlog.get_logger()


class LLMClient:
    def __init__(self, openai_api_key: str, groq_api_key: str) -> None:
        self._openai = OpenAI(api_key=openai_api_key)
        self._groq = Groq(api_key=groq_api_key)

    def call_llm(
        self,
        system: str,
        user: str,
        max_tokens: int = 500,
        analysis: bool = True,
        backend: Backend = "openai",
    ) -> str:
        temperature = 0.2 if analysis else 0.5
        model = _MODELS[backend]
        last_exc: Exception | None = None

        for attempt in range(_MAX_RETRIES):
            try:
                start = time.monotonic()
                if backend == "groq":
                    response = self._groq.chat.completions.create(
                        model=model,
                        max_tokens=max_tokens,
                        temperature=temperature,
                        messages=[
                            {"role": "system", "content": system},
                            {"role": "user", "content": user},
                        ],
                    )
                    text = response.choices[0].message.content or ""
                    usage = response.usage
                    log.info(
                        "llm_call",
                        model=model,
                        input_tokens=usage.prompt_tokens if usage else 0,
                        output_tokens=usage.completion_tokens if usage else 0,
                        latency_ms=int((time.monotonic() - start) * 1000),
                    )
                else:
                    response = self._openai.chat.completions.create(
                        model=model,
                        max_tokens=max_tokens,
                        temperature=temperature,
                        messages=[
                            {"role": "system", "content": system},
                            {"role": "user", "content": user},
                        ],
                    )
                    text = response.choices[0].message.content or ""
                    usage = response.usage
                    log.info(
                        "llm_call",
                        model=model,
                        input_tokens=usage.prompt_tokens if usage else 0,
                        output_tokens=usage.completion_tokens if usage else 0,
                        latency_ms=int((time.monotonic() - start) * 1000),
                    )
                return text

            except (GroqRateLimitError, OpenAIRateLimitError) as exc:
                last_exc = exc
                wait = _BACKOFF_BASE ** attempt
                log.warning("llm_rate_limit", model=model, attempt=attempt, wait_s=wait)
                time.sleep(wait)
            except (GroqAPIError, OpenAIAPIError) as exc:
                last_exc = exc
                log.error("llm_api_error", model=model, attempt=attempt, error=str(exc))
                if attempt < _MAX_RETRIES - 1:
                    time.sleep(_BACKOFF_BASE ** attempt)

        raise RuntimeError(f"LLM call failed after {_MAX_RETRIES} attempts: {last_exc}")

    def call_llm_json(
        self,
        system: str,
        user: str,
        max_tokens: int = 500,
        analysis: bool = True,
        backend: Backend = "openai",
    ) -> Any:
        """Call LLM and parse response as JSON. Raises ValueError on parse failure."""
        raw = self.call_llm(system, user, max_tokens=max_tokens, analysis=analysis, backend=backend)
        text = raw.strip()
        if text.startswith("```"):
            text = text.split("\n", 1)[-1]
            if text.endswith("```"):
                text = text[: text.rfind("```")]
        try:
            return json.loads(text.strip())
        except json.JSONDecodeError as exc:
            raise ValueError(f"LLM returned non-JSON response: {raw[:200]}") from exc
