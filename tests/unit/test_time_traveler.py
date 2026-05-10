"""Unit tests for Time Traveler tools (Tools 1-4)."""

from unittest.mock import MagicMock, patch

import pytest
from chronocare.tools.time_traveler import (
    generate_patient_narrative,
    identify_clinical_turning_points,
    order_events_chronologically,
)


SAMPLE_EVENTS = [
    {"event_type": "condition", "date": "2020-07-22", "description": "Diabetes", "value": None},
    {"event_type": "condition", "date": "2019-03-12", "description": "Hypertension", "value": None},
    {"event_type": "observation", "date": "2022-11-08", "description": "Creatinine", "value": 1.1},
    {"event_type": "observation", "date": "2026-02-14", "description": "Creatinine", "value": 1.3},
]

SAMPLE_HISTORY = {"patient": {"id": "p1", "name": "John Doe"}, "events": SAMPLE_EVENTS}


def test_order_events_chronologically_sorts():
    result = order_events_chronologically(SAMPLE_HISTORY)
    dates = [e["date"] for e in result]
    assert dates == sorted(dates)


def test_order_events_chronologically_deduplicates():
    history = {
        "events": [
            {"event_type": "condition", "date": "2019-03-12", "description": "Hypertension", "value": None},
            {"event_type": "condition", "date": "2019-03-12", "description": "Hypertension", "value": None},
        ]
    }
    result = order_events_chronologically(history)
    assert len(result) == 1


def test_order_events_handles_empty():
    assert order_events_chronologically({"events": []}) == []


def test_identify_turning_points_sparse_timeline():
    """Fewer than 2 events → empty list without LLM call."""
    result = identify_clinical_turning_points([SAMPLE_EVENTS[0]], llm=MagicMock())
    assert result == []


def test_identify_turning_points_llm_success():
    mock_llm = MagicMock()
    mock_llm.call_llm_json.return_value = [
        {"date": "2019-03-12", "event": "Hypertension diagnosed", "significance": "Starting point."}
    ]
    result = identify_clinical_turning_points(SAMPLE_EVENTS, llm=mock_llm)
    assert len(result) == 1
    assert result[0]["date"] == "2019-03-12"


def test_identify_turning_points_llm_failure_returns_empty():
    mock_llm = MagicMock()
    mock_llm.call_llm_json.side_effect = ValueError("bad json")
    result = identify_clinical_turning_points(SAMPLE_EVENTS, llm=mock_llm)
    assert result == []


def test_generate_narrative_empty_timeline():
    result = generate_patient_narrative([], [], llm=MagicMock())
    assert "Insufficient" in result


def test_generate_narrative_llm_success():
    mock_llm = MagicMock()
    mock_llm.call_llm.return_value = "John has a complex history beginning with hypertension in 2019."
    result = generate_patient_narrative(SAMPLE_EVENTS, [], llm=mock_llm)
    assert "hypertension" in result.lower()


def test_generate_narrative_llm_failure_graceful():
    mock_llm = MagicMock()
    mock_llm.call_llm.side_effect = RuntimeError("API down")
    result = generate_patient_narrative(SAMPLE_EVENTS, [], llm=mock_llm)
    assert "Unable" in result
