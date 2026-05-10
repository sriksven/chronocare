"""Unit tests for FHIR normalizer."""

import pytest
from chronocare.fhir.normalizer import (
    normalize_condition,
    normalize_observation,
    normalize_medication_request,
    normalize_encounter,
    normalize_patient,
    normalize_all,
)


def test_normalize_patient_full():
    resource = {
        "id": "p1",
        "name": [{"family": "Doe", "given": ["John", "Michael"]}],
        "birthDate": "1963-04-15",
        "gender": "male",
    }
    result = normalize_patient(resource)
    assert result["id"] == "p1"
    assert result["name"] == "John Michael Doe"
    assert result["birth_date"] == "1963-04-15"
    assert result["gender"] == "male"


def test_normalize_patient_empty_name():
    resource = {"id": "p2", "name": [{}], "birthDate": "1990-01-01", "gender": "female"}
    result = normalize_patient(resource)
    assert result["name"] == ""


def test_normalize_condition_with_icd10():
    resource = {
        "code": {
            "coding": [{"system": "http://hl7.org/fhir/sid/icd-10", "code": "I10", "display": "Hypertension"}]
        },
        "clinicalStatus": {"coding": [{"code": "active"}]},
        "onsetDateTime": "2019-03-12",
    }
    result = normalize_condition(resource)
    assert result["event_type"] == "condition"
    assert result["date"] == "2019-03-12"
    assert "Hypertension" in result["description"]
    assert result["status"] == "active"


def test_normalize_condition_no_date():
    resource = {
        "code": {"coding": [{"system": "http://hl7.org/fhir/sid/icd-10", "code": "E11"}]},
        "clinicalStatus": {"coding": [{"code": "active"}]},
    }
    result = normalize_condition(resource)
    assert result["date"] == ""


def test_normalize_observation_quantity():
    resource = {
        "code": {
            "coding": [{"system": "http://loinc.org", "code": "2160-0", "display": "Creatinine"}]
        },
        "valueQuantity": {"value": 1.3, "unit": "mg/dL"},
        "effectiveDateTime": "2026-02-14",
    }
    result = normalize_observation(resource)
    assert result["event_type"] == "observation"
    assert result["value"] == 1.3
    assert result["unit"] == "mg/dL"
    assert result["date"] == "2026-02-14"


def test_normalize_observation_string_value():
    resource = {
        "code": {"coding": [{"system": "http://loinc.org", "code": "55284-4"}]},
        "valueString": "138/88",
        "effectiveDateTime": "2026-03-02",
    }
    result = normalize_observation(resource)
    assert result["value"] == "138/88"


def test_normalize_medication_request():
    resource = {
        "medicationCodeableConcept": {
            "coding": [{"system": "http://www.nlm.nih.gov/research/umls/rxnorm", "code": "29046", "display": "Lisinopril"}],
            "text": "Lisinopril 10mg",
        },
        "status": "active",
        "authoredOn": "2019-06-01",
    }
    result = normalize_medication_request(resource)
    assert result["event_type"] == "medication"
    assert result["status"] == "active"
    assert "Lisinopril" in result["description"]


def test_normalize_all_sorts_by_date():
    raw = {
        "Patient": [{"id": "p1", "name": [{"family": "Doe", "given": ["John"]}], "birthDate": "1963-04-15", "gender": "male"}],
        "Condition": [
            {
                "code": {"coding": [{"system": "http://hl7.org/fhir/sid/icd-10", "code": "E11", "display": "Diabetes"}]},
                "clinicalStatus": {"coding": [{"code": "active"}]},
                "onsetDateTime": "2020-07-22",
            },
            {
                "code": {"coding": [{"system": "http://hl7.org/fhir/sid/icd-10", "code": "I10", "display": "Hypertension"}]},
                "clinicalStatus": {"coding": [{"code": "active"}]},
                "onsetDateTime": "2019-03-12",
            },
        ],
        "Observation": [],
        "MedicationRequest": [],
        "Encounter": [],
        "DocumentReference": [],
        "DiagnosticReport": [],
    }
    result = normalize_all(raw)
    events = result["events"]
    dates = [e["date"] for e in events if e["date"]]
    assert dates == sorted(dates), "Events should be sorted chronologically"


def test_normalize_all_handles_empty_resources():
    raw = {
        "Patient": [{"id": "p1", "name": [{"family": "Test"}], "birthDate": "1990-01-01", "gender": "unknown"}],
        "Condition": [],
        "Observation": [],
        "MedicationRequest": [],
        "Encounter": [],
        "DocumentReference": [],
        "DiagnosticReport": [],
    }
    result = normalize_all(raw)
    assert result["events"] == []
    assert result["patient"]["id"] == "p1"
