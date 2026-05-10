"""Unit tests for the unified brief assembler (Tool 13)."""

from chronocare.tools.synthesis import generate_unified_brief


PATIENT = {"id": "p1", "name": "John Doe", "birth_date": "1963-04-15", "gender": "male"}


def test_brief_has_all_top_level_keys():
    brief = generate_unified_brief(
        patient=PATIENT,
        narrative="Patient has hypertension.",
        turning_points=[],
        early_warning={"risk_level": "medium"},
        causal_hypothesis="Hypertension led to CKD.",
        comorbidity_map=[],
        guideline_matches=[],
        recommendations=[],
    )
    expected_keys = {
        "patient_summary", "clinical_narrative", "turning_points",
        "early_warning", "causal_hypothesis", "comorbidity_map",
        "guideline_matches", "recommendations", "generated_at", "schema_version",
    }
    assert expected_keys.issubset(set(brief.keys()))


def test_brief_patient_summary_populated():
    brief = generate_unified_brief(
        patient=PATIENT,
        narrative="",
        turning_points=[],
        early_warning={},
        causal_hypothesis="",
        comorbidity_map=[],
        guideline_matches=[],
        recommendations=[],
    )
    assert brief["patient_summary"]["name"] == "John Doe"
    assert brief["patient_summary"]["id"] == "p1"


def test_brief_schema_version():
    brief = generate_unified_brief(
        patient=PATIENT, narrative="", turning_points=[], early_warning={},
        causal_hypothesis="", comorbidity_map=[], guideline_matches=[], recommendations=[],
    )
    assert brief["schema_version"] == "1.0"


def test_brief_generated_at_is_iso():
    import re
    brief = generate_unified_brief(
        patient=PATIENT, narrative="", turning_points=[], early_warning={},
        causal_hypothesis="", comorbidity_map=[], guideline_matches=[], recommendations=[],
    )
    assert re.match(r"\d{4}-\d{2}-\d{2}T", brief["generated_at"])
