"""Tool 13: generate_unified_brief — pure assembly, no LLM call.

Merges all pipeline outputs into a single structured clinical brief.
This is the final output returned to the A2A agent for formatting.
"""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any


def generate_unified_brief(
    patient: dict[str, Any],
    narrative: str,
    turning_points: list[dict[str, Any]],
    early_warning: dict[str, Any],
    causal_hypothesis: str,
    comorbidity_map: list[dict[str, Any]],
    guideline_matches: list[dict[str, Any]],
    recommendations: list[dict[str, Any]],
) -> dict[str, Any]:
    """Assemble all pipeline outputs into a unified clinical brief.

    Structure is stable — the A2A agent's system prompt references specific
    top-level keys. Do not rename keys without updating the agent prompt.
    """
    return {
        "patient_summary": {
            "id": patient.get("id", ""),
            "name": patient.get("name", ""),
            "birth_date": patient.get("birth_date", ""),
            "gender": patient.get("gender", ""),
        },
        "clinical_narrative": narrative,
        "turning_points": turning_points,
        "early_warning": early_warning,
        "causal_hypothesis": causal_hypothesis,
        "comorbidity_map": comorbidity_map,
        "guideline_matches": guideline_matches,
        "recommendations": recommendations,
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "schema_version": "1.0",
    }
