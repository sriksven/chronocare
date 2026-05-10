"""Integration tests for the full 13-tool pipeline.

These tests mock the FHIR client and LLM but exercise the actual tool
chain end-to-end to verify data flows correctly through all stages.

Run with: pytest tests/integration/ -v
"""

from __future__ import annotations

import json
import pathlib
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from chronocare.fhir.cache import TTLCache
from chronocare.fhir.normalizer import normalize_all
from chronocare.tools import deterioration, recommendations, root_cause, synthesis, time_traveler

_FIXTURE = pathlib.Path(__file__).parent.parent / "fixtures" / "demo_patient_fhir.json"


@pytest.fixture
def demo_bundle():
    with open(_FIXTURE) as f:
        bundle = json.load(f)
    raw: dict = {
        "Patient": [],
        "Condition": [],
        "Observation": [],
        "MedicationRequest": [],
        "Encounter": [],
        "DocumentReference": [],
        "DiagnosticReport": [],
    }
    for entry in bundle["entry"]:
        resource = entry["resource"]
        rt = resource["resourceType"]
        if rt in raw:
            raw[rt].append(resource)
    return raw


@pytest.fixture
def normalized_history(demo_bundle):
    return normalize_all(demo_bundle)


@pytest.fixture
def timeline(normalized_history):
    return time_traveler.order_events_chronologically(normalized_history)


@pytest.fixture
def mock_llm():
    llm = MagicMock()
    llm.call_llm.return_value = "Patient has complex multimorbidity with hypertension, diabetes, and CKD."
    llm.call_llm_json.return_value = [
        {"date": "2019-03-12", "event": "Hypertension diagnosed", "significance": "Cascade starting point."}
    ]
    return llm


def test_normalize_demo_bundle_has_events(normalized_history):
    assert len(normalized_history["events"]) > 0
    assert normalized_history["patient"]["name"] == "John Doe"


def test_timeline_is_sorted(timeline):
    dates = [e["date"] for e in timeline if e["date"]]
    assert dates == sorted(dates)


def test_turning_points_with_rich_timeline(timeline, mock_llm):
    result = time_traveler.identify_clinical_turning_points(timeline, mock_llm)
    assert isinstance(result, list)


def test_get_recent_signals_returns_subset(timeline):
    signals = deterioration.get_recent_signals(timeline, lookback_days=365)
    assert all(s in timeline for s in signals)


def test_analyze_weak_patterns_returns_dict(timeline, mock_llm):
    mock_llm.call_llm_json.return_value = {
        "risk_level": "medium",
        "signal_clusters": [],
        "overall_assessment": "Concerning.",
        "individually_normal_but_together": True,
    }
    signals = deterioration.get_recent_signals(timeline, lookback_days=365)
    result = deterioration.analyze_weak_patterns(signals, mock_llm)
    assert "risk_level" in result


def test_full_pipeline_produces_brief(timeline, normalized_history, mock_llm):
    mock_llm.call_llm.return_value = "Narrative text."
    mock_llm.call_llm_json.side_effect = [
        # turning points
        [{"date": "2019-03-12", "event": "HTN", "significance": "Start."}],
        # weak patterns
        {"risk_level": "medium", "signal_clusters": [], "overall_assessment": "Concerning.", "individually_normal_but_together": True},
        # early warning
        {"risk_level": "medium", "key_signals": [], "trend_direction": "worsening", "time_sensitivity": "urgent", "recommended_monitoring": "Monitor", "summary": "Concerning."},
        # correlations
        [{"cause_event": "HTN", "cause_date": "2019-03-12", "effect_event": "CKD", "effect_date": "2022-11-08", "confidence": "high", "rationale": "Known pathway."}],
        # comorbidity map
        [{"condition_a": "HTN", "condition_b": "CKD", "interaction": "HTN causes CKD", "clinical_significance": "high"}],
        # guidelines
        [{"guideline": "KDIGO", "recommendation": "Nephrology referral", "current_status": "gap", "note": "No referral found."}],
        # recommendations
        [{"priority": 1, "action": "Nephrology referral", "rationale": "Rising creatinine.", "specific_finding": "Creatinine 1.3", "urgency": "urgent"}],
    ]
    mock_llm.call_llm.return_value = "Causal hypothesis: HTN led to CKD."

    turning_points = time_traveler.identify_clinical_turning_points(timeline, mock_llm)
    narrative = time_traveler.generate_patient_narrative(timeline, turning_points, mock_llm)
    signals = deterioration.get_recent_signals(timeline, lookback_days=365)
    patterns = deterioration.analyze_weak_patterns(signals, mock_llm)
    warning = deterioration.generate_early_warning_report(patterns, mock_llm)
    correlations = root_cause.correlate_events(timeline, mock_llm)

    # Reset for causal hypothesis (call_llm not call_llm_json)
    mock_llm.call_llm.return_value = "Causal hypothesis: HTN led to CKD."
    hypothesis = root_cause.generate_causal_hypothesis(correlations, mock_llm)

    comorbidity_map = recommendations.map_comorbidities(normalized_history["events"], mock_llm)
    guideline_matches = recommendations.match_clinical_guidelines(
        normalized_history["events"], signals, mock_llm
    )
    recs = recommendations.generate_recommendations(hypothesis, guideline_matches, warning, mock_llm)

    brief = synthesis.generate_unified_brief(
        patient=normalized_history["patient"],
        narrative=narrative,
        turning_points=turning_points,
        early_warning=warning,
        causal_hypothesis=hypothesis,
        comorbidity_map=comorbidity_map,
        guideline_matches=guideline_matches,
        recommendations=recs,
    )

    assert brief["patient_summary"]["name"] == "John Doe"
    assert brief["clinical_narrative"]
    assert "risk_level" in brief["early_warning"]
    assert isinstance(brief["recommendations"], list)
