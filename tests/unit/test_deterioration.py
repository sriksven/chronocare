"""Unit tests for Silent Deterioration Detector (Tools 5-7)."""

from datetime import date, timedelta
from unittest.mock import MagicMock

import pytest
from chronocare.tools.deterioration import (
    analyze_weak_patterns,
    generate_early_warning_report,
    get_recent_signals,
)


def _make_event(event_type: str, days_ago: int, description: str, value=None) -> dict:
    event_date = (date.today() - timedelta(days=days_ago)).isoformat()
    return {"event_type": event_type, "date": event_date, "description": description, "value": value}


RECENT = [
    _make_event("observation", 10, "Blood pressure", "138/88"),
    _make_event("observation", 20, "Creatinine", 1.3),
    _make_event("note", 15, "Patient reports fatigue", None),
]
OLD = [
    _make_event("condition", 400, "Hypertension", None),
    _make_event("condition", 300, "Diabetes", None),
]
TIMELINE = OLD + RECENT


def test_get_recent_signals_filters_correctly():
    result = get_recent_signals(TIMELINE, lookback_days=90)
    assert all(e in result for e in RECENT)
    assert all(e not in result for e in OLD)


def test_get_recent_signals_empty_timeline():
    assert get_recent_signals([], lookback_days=90) == []


def test_get_recent_signals_no_matches_beyond_cutoff():
    only_old = [_make_event("condition", 365, "Old condition", None)]
    result = get_recent_signals(only_old, lookback_days=30)
    assert result == []


def test_analyze_weak_patterns_empty_signals():
    result = analyze_weak_patterns([], llm=MagicMock())
    assert result["risk_level"] == "low"
    assert result["signal_clusters"] == []


def test_analyze_weak_patterns_medium_risk():
    mock_llm = MagicMock()
    mock_llm.call_llm_json.return_value = {
        "risk_level": "medium",
        "signal_clusters": [
            {
                "signals": ["BP 138/88", "Creatinine 1.3", "Fatigue x2"],
                "pattern": "Pre-hypertensive BP with rising creatinine and fatigue",
                "concern": "Possible early CKD progression"
            }
        ],
        "overall_assessment": "Individually normal but concerning in combination.",
        "individually_normal_but_together": True,
    }
    result = analyze_weak_patterns(RECENT, llm=mock_llm)
    assert result["risk_level"] == "medium"
    assert result["individually_normal_but_together"] is True


def test_analyze_weak_patterns_llm_failure_graceful():
    mock_llm = MagicMock()
    mock_llm.call_llm_json.side_effect = RuntimeError("LLM down")
    result = analyze_weak_patterns(RECENT, llm=mock_llm)
    assert result["risk_level"] == "unknown"


def test_generate_early_warning_llm_success():
    mock_llm = MagicMock()
    mock_llm.call_llm_json.return_value = {
        "risk_level": "medium",
        "key_signals": ["BP 138/88", "Creatinine 1.3"],
        "trend_direction": "worsening",
        "time_sensitivity": "urgent",
        "recommended_monitoring": "Repeat BMP in 2 weeks",
        "summary": "Early CKD stress pattern detected.",
    }
    pattern = {"risk_level": "medium", "signal_clusters": [], "overall_assessment": "..."}
    result = generate_early_warning_report(pattern, llm=mock_llm)
    assert result["trend_direction"] == "worsening"
    assert result["time_sensitivity"] == "urgent"


def test_generate_early_warning_llm_failure_uses_fallback():
    mock_llm = MagicMock()
    mock_llm.call_llm_json.side_effect = ValueError("bad json")
    pattern = {"risk_level": "high"}
    result = generate_early_warning_report(pattern, llm=mock_llm)
    assert result["risk_level"] == "high"  # fallback preserves original risk level
