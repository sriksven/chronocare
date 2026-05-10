"""Tools 8-9: Root Cause Analyzer.

Tool 8: correlate_events
Tool 9: generate_causal_hypothesis
"""

from __future__ import annotations

import json
from typing import Any

from chronocare.reasoning.llm_client import LLMClient
from chronocare.reasoning.prompts import causal_hypothesis_prompt, correlate_events_prompt


def correlate_events(
    timeline: list[dict[str, Any]],
    llm: LLMClient,
) -> list[dict[str, Any]]:
    """LLM Call 5: Identify plausible causal relationships between clinical events.

    Returns list of {cause_event, cause_date, effect_event, effect_date,
    confidence, rationale} dicts sorted by confidence descending.
    """
    if len(timeline) < 3:
        return []

    timeline_json = json.dumps(timeline[:100], indent=2)
    system, user = correlate_events_prompt(timeline_json)
    try:
        # Switched from groq llama-3.3 to openai gpt-4o-mini: llama was too
        # conservative on causal inference and frequently returned []. Mini is
        # cheap, fast, and follows the structured-JSON contract more reliably.
        result = llm.call_llm_json(
            system, user, max_tokens=900, analysis=True, backend="openai-mini"
        )
        # Some models wrap the array in {"correlations": [...]} — unwrap.
        if isinstance(result, dict):
            for v in result.values():
                if isinstance(v, list):
                    result = v
                    break
        if not isinstance(result, list):
            return []
        # Filter out malformed entries that lack the required keys.
        result = [
            r for r in result
            if isinstance(r, dict) and r.get("cause_event") and r.get("effect_event")
        ]
        order = {"high": 0, "medium": 1, "low": 2}
        return sorted(result, key=lambda x: order.get(x.get("confidence", "low"), 2))
    except (ValueError, RuntimeError):
        return []


def generate_causal_hypothesis(
    correlations: list[dict[str, Any]],
    llm: LLMClient,
) -> str:
    """LLM Call 6: Synthesize correlated events into a causal narrative hypothesis.

    Returns a 150-word plain-text hypothesis. Falls back to a summary of
    top correlations if LLM fails.
    """
    if not correlations:
        return "Insufficient event correlations to generate a causal hypothesis."

    correlations_json = json.dumps(correlations[:10], indent=2)
    system, user = causal_hypothesis_prompt(correlations_json)
    try:
        return llm.call_llm(system, user, max_tokens=400, analysis=False, backend="openai")
    except RuntimeError:
        top = correlations[0]
        return (
            f"Preliminary analysis suggests '{top.get('cause_event')}' "
            f"({top.get('cause_date')}) may have contributed to "
            f"'{top.get('effect_event')}' ({top.get('effect_date')}). "
            f"Full hypothesis generation unavailable."
        )
