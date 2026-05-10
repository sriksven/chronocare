"""Tools 1-4: Time Traveler — patient history retrieval and narrative generation.

Tool 1: get_full_patient_history
Tool 2: order_events_chronologically
Tool 3: identify_clinical_turning_points
Tool 4: generate_patient_narrative
"""

from __future__ import annotations

import json
from datetime import datetime, timedelta
from typing import Any

from chronocare.fhir.cache import TTLCache
from chronocare.fhir.client import FHIRClient
from chronocare.fhir.normalizer import normalize_all
from chronocare.reasoning.llm_client import LLMClient
from chronocare.reasoning.prompts import narrative_prompt, turning_points_prompt


async def get_full_patient_history(
    patient_id: str,
    fhir_base_url: str,
    fhir_token: str,
    cache: TTLCache,
) -> dict[str, Any]:
    """Fetch and normalize all FHIR resources for a patient.

    Returns structured dict with 'patient' metadata and flat 'events' list.
    Results are cached by patient_id for cache_ttl_seconds.
    """
    cache_key = f"{patient_id}:all"
    cached = cache.get(cache_key)
    if cached is not None:
        return cached

    client = FHIRClient(fhir_base_url, fhir_token)
    raw = await client.get_all_resources(patient_id)
    normalized = normalize_all(raw)
    cache.set(cache_key, normalized)
    return normalized


def order_events_chronologically(history: dict[str, Any]) -> list[dict[str, Any]]:
    """Sort events by date, deduplicate exact matches.

    Pure Python — no LLM. Events with no date are placed at the beginning
    to avoid silently dropping them.
    """
    events = history.get("events", [])
    seen: set[str] = set()
    unique_events: list[dict[str, Any]] = []
    for event in events:
        key = f"{event.get('date', '')}|{event.get('description', '')}|{event.get('value', '')}"
        if key not in seen:
            seen.add(key)
            unique_events.append(event)
    return sorted(unique_events, key=lambda e: e.get("date", "") or "")


def identify_clinical_turning_points(
    timeline: list[dict[str, Any]],
    llm: LLMClient,
) -> list[dict[str, Any]]:
    """LLM Call 1: Identify 3-5 key clinical turning points in a patient's history.

    Returns list of {date, event, significance} dicts.
    Falls back to empty list if LLM returns malformed output.
    """
    if len(timeline) < 2:
        return []
    timeline_json = json.dumps(timeline[:100], indent=2)  # cap at 100 events
    system, user = turning_points_prompt(timeline_json)
    try:
        result = llm.call_llm_json(system, user, max_tokens=600, analysis=True, backend="groq")
        return result if isinstance(result, list) else []
    except (ValueError, RuntimeError):
        return []


def generate_patient_narrative(
    timeline: list[dict[str, Any]],
    turning_points: list[dict[str, Any]],
    llm: LLMClient,
) -> str:
    """LLM Call 2: Generate a 200-300 word clinical narrative from timeline + turning points.

    Returns plain text narrative. Falls back to a minimal summary on failure.
    """
    if not timeline:
        return "Insufficient data to generate patient narrative."

    timeline_json = json.dumps(timeline[:100], indent=2)
    turning_points_json = json.dumps(turning_points, indent=2)
    system, user = narrative_prompt(timeline_json, turning_points_json)
    try:
        return llm.call_llm(system, user, max_tokens=600, analysis=False, backend="openai")
    except RuntimeError:
        return "Unable to generate narrative — LLM unavailable."
