"""Tools 5-7: Silent Deterioration Detector.

Tool 5: get_recent_signals
Tool 6: analyze_weak_patterns
Tool 7: generate_early_warning_report
"""

from __future__ import annotations

import json
from datetime import date, timedelta
from typing import Any

from chronocare.reasoning.llm_client import LLMClient
from chronocare.reasoning.prompts import early_warning_prompt, weak_patterns_prompt


def get_recent_signals(
    timeline: list[dict[str, Any]],
    lookback_days: int = 90,
) -> list[dict[str, Any]]:
    """Filter timeline to events within the past N days.

    Pure Python — no LLM, no FHIR calls. Operates on the already-normalized
    timeline from order_events_chronologically.
    """
    cutoff = (date.today() - timedelta(days=lookback_days)).isoformat()
    return [
        event for event in timeline
        if (event.get("date") or "") >= cutoff
    ]


def analyze_weak_patterns(
    recent_signals: list[dict[str, Any]],
    llm: LLMClient,
) -> dict[str, Any]:
    """LLM Call 3: Holistic multi-signal pattern analysis.

    This is the core clinical intelligence step. The LLM is instructed to
    reason across all signals together — not fire on individual thresholds.

    Returns:
        {risk_level, signal_clusters, overall_assessment, individually_normal_but_together}
    """
    if not recent_signals:
        return {
            "risk_level": "low",
            "signal_clusters": [],
            "overall_assessment": "No recent signals available for analysis.",
            "individually_normal_but_together": False,
        }

    signals_json = json.dumps(recent_signals, indent=2)
    system, user = weak_patterns_prompt(signals_json)
    try:
        result = llm.call_llm_json(system, user, max_tokens=700, analysis=True, backend="openai")
        if not isinstance(result, dict):
            raise ValueError("unexpected shape")
        return result
    except (ValueError, RuntimeError):
        return {
            "risk_level": "unknown",
            "signal_clusters": [],
            "overall_assessment": "Pattern analysis unavailable.",
            "individually_normal_but_together": False,
        }


def generate_early_warning_report(
    pattern_analysis: dict[str, Any],
    llm: LLMClient,
) -> dict[str, Any]:
    """LLM Call 4: Format pattern analysis into a structured early warning report.

    Returns:
        {risk_level, key_signals, trend_direction, time_sensitivity,
         recommended_monitoring, summary}
    """
    analysis_json = json.dumps(pattern_analysis, indent=2)
    system, user = early_warning_prompt(analysis_json)
    try:
        result = llm.call_llm_json(system, user, max_tokens=400, analysis=True, backend="groq")
        if not isinstance(result, dict):
            raise ValueError("unexpected shape")
        return result
    except (ValueError, RuntimeError):
        return {
            "risk_level": pattern_analysis.get("risk_level", "unknown"),
            "key_signals": [],
            "trend_direction": "unknown",
            "time_sensitivity": "routine",
            "recommended_monitoring": "Standard monitoring.",
            "summary": "Early warning report generation failed.",
        }
