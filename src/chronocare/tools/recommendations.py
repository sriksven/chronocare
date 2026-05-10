"""Tools 10-12: Recommendation Engine.

Tool 10: map_comorbidities
Tool 11: match_clinical_guidelines
Tool 12: generate_recommendations
"""

from __future__ import annotations

import json
from typing import Any

from chronocare.reasoning.llm_client import LLMClient
from chronocare.reasoning.prompts import (
    comorbidity_map_prompt,
    guidelines_prompt,
    recommendations_prompt,
)


def _extract_active_conditions(events: list[dict[str, Any]]) -> list[dict[str, Any]]:
    return [e for e in events if e.get("event_type") == "condition" and e.get("status") in ("active", "")]


def _extract_active_medications(events: list[dict[str, Any]]) -> list[dict[str, Any]]:
    return [e for e in events if e.get("event_type") == "medication" and e.get("status") in ("active", "")]


def map_comorbidities(
    events: list[dict[str, Any]],
    llm: LLMClient,
) -> list[dict[str, Any]]:
    """LLM Call 7a: Map interactions between the patient's active conditions.

    Returns list of {condition_a, condition_b, interaction, clinical_significance}.
    """
    conditions = _extract_active_conditions(events)
    if len(conditions) < 2:
        return []

    conditions_json = json.dumps(conditions, indent=2)
    system, user = comorbidity_map_prompt(conditions_json)
    try:
        result = llm.call_llm_json(system, user, max_tokens=500, analysis=True, backend="groq")
        return result if isinstance(result, list) else []
    except (ValueError, RuntimeError):
        return []


def match_clinical_guidelines(
    events: list[dict[str, Any]],
    recent_signals: list[dict[str, Any]],
    llm: LLMClient,
) -> list[dict[str, Any]]:
    """LLM Call 7b: Match patient profile against major clinical guidelines.

    Uses LLM's embedded knowledge of ADA, JNC, KDIGO, ACC/AHA guidelines.
    Returns list of {guideline, recommendation, current_status, note}.
    """
    conditions = _extract_active_conditions(events)
    medications = _extract_active_medications(events)

    if not conditions:
        return []

    conditions_json = json.dumps(conditions, indent=2)
    medications_json = json.dumps(medications, indent=2)
    signals_json = json.dumps(recent_signals[:20], indent=2)

    system, user = guidelines_prompt(conditions_json, medications_json, signals_json)
    try:
        result = llm.call_llm_json(system, user, max_tokens=700, analysis=True, backend="openai-mini")
        return result if isinstance(result, list) else []
    except (ValueError, RuntimeError):
        return []


def generate_recommendations(
    causal_hypothesis: str,
    guideline_matches: list[dict[str, Any]],
    early_warning: dict[str, Any],
    llm: LLMClient,
) -> list[dict[str, Any]]:
    """LLM Call 8: Generate 3-5 specific, patient-specific clinical recommendations.

    Every recommendation must cite a specific finding. Returns list of
    {priority, action, rationale, specific_finding, urgency} sorted by priority.
    """
    guideline_json = json.dumps(guideline_matches, indent=2)
    warning_json = json.dumps(early_warning, indent=2)

    system, user = recommendations_prompt(causal_hypothesis, guideline_json, warning_json)
    try:
        result = llm.call_llm_json(system, user, max_tokens=700, analysis=True, backend="openai")
        if not isinstance(result, list):
            return []
        return sorted(result, key=lambda x: int(x.get("priority", 99)))
    except (ValueError, RuntimeError):
        return [
            {
                "priority": 1,
                "action": "Clinical review required",
                "rationale": "Automated recommendation generation failed.",
                "specific_finding": "N/A",
                "urgency": "routine",
            }
        ]
