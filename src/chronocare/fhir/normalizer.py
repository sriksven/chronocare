"""Converts raw FHIR JSON into flat, human-readable Python dicts.

Decodes LOINC → lab names, ICD-10 → condition names, RxNorm → drug names.
All code lookups fall back to the raw code string if not found in mappings,
so missing entries never crash the pipeline.
"""

from __future__ import annotations

import json
import pathlib
from datetime import datetime
from typing import Any

_MAPPINGS_PATH = pathlib.Path(__file__).parent.parent.parent.parent / "data" / "code_mappings"


def _load_mapping(filename: str) -> dict[str, str]:
    path = _MAPPINGS_PATH / filename
    if path.exists():
        return json.loads(path.read_text())
    return {}


_LOINC: dict[str, str] = _load_mapping("loinc.json")
_ICD10: dict[str, str] = _load_mapping("icd10.json")
_RXNORM: dict[str, str] = _load_mapping("rxnorm.json")


def _first_code(coding_list: list[dict], system_hint: str = "") -> tuple[str, str]:
    """Return (system, code) from the first matching coding entry."""
    for entry in coding_list:
        system = entry.get("system", "")
        code = entry.get("code", "")
        if code:
            return system, code
    return "", ""


def _decode_code(system: str, code: str, display: str = "") -> str:
    if display:
        return display
    if "loinc" in system.lower():
        return _LOINC.get(code, code)
    if "icd" in system.lower() or "snomed" in system.lower():
        return _ICD10.get(code, code)
    if "rxnorm" in system.lower():
        return _RXNORM.get(code, code)
    return code


def _parse_date(raw: str | None) -> str:
    if not raw:
        return ""
    try:
        return datetime.fromisoformat(raw.replace("Z", "+00:00")).date().isoformat()
    except (ValueError, AttributeError):
        return raw[:10] if raw else ""


def normalize_patient(resource: dict[str, Any]) -> dict[str, Any]:
    name_parts = resource.get("name", [{}])[0]
    given = " ".join(name_parts.get("given", []))
    family = name_parts.get("family", "")
    return {
        "id": resource.get("id", ""),
        "name": f"{given} {family}".strip(),
        "birth_date": resource.get("birthDate", ""),
        "gender": resource.get("gender", ""),
    }


def normalize_condition(resource: dict[str, Any]) -> dict[str, Any]:
    coding = resource.get("code", {}).get("coding", [])
    system, code = _first_code(coding)
    display = resource.get("code", {}).get("text") or (coding[0].get("display") if coding else "")
    onset = (
        resource.get("onsetDateTime")
        or resource.get("onsetPeriod", {}).get("start")
        or ""
    )
    return {
        "event_type": "condition",
        "date": _parse_date(onset),
        "description": _decode_code(system, code, display),
        "code": code,
        "status": resource.get("clinicalStatus", {}).get("coding", [{}])[0].get("code", ""),
    }


def normalize_observation(resource: dict[str, Any]) -> dict[str, Any]:
    coding = resource.get("code", {}).get("coding", [])
    system, code = _first_code(coding)
    display = resource.get("code", {}).get("text") or (coding[0].get("display") if coding else "")
    value: Any = None
    unit = ""
    if "valueQuantity" in resource:
        value = resource["valueQuantity"].get("value")
        unit = resource["valueQuantity"].get("unit", "")
    elif "valueString" in resource:
        value = resource["valueString"]
    elif "valueCodeableConcept" in resource:
        value = resource["valueCodeableConcept"].get("text", "")
    return {
        "event_type": "observation",
        "date": _parse_date(resource.get("effectiveDateTime") or resource.get("effectivePeriod", {}).get("start")),
        "description": _decode_code(system, code, display),
        "value": value,
        "unit": unit,
        "code": code,
    }


def normalize_medication_request(resource: dict[str, Any]) -> dict[str, Any]:
    coding = resource.get("medicationCodeableConcept", {}).get("coding", [])
    system, code = _first_code(coding)
    display = resource.get("medicationCodeableConcept", {}).get("text") or (coding[0].get("display") if coding else "")
    return {
        "event_type": "medication",
        "date": _parse_date(resource.get("authoredOn")),
        "description": _decode_code(system, code, display),
        "code": code,
        "status": resource.get("status", ""),
    }


def normalize_encounter(resource: dict[str, Any]) -> dict[str, Any]:
    type_coding = resource.get("type", [{}])[0].get("coding", []) if resource.get("type") else []
    system, code = _first_code(type_coding)
    display = resource.get("type", [{}])[0].get("text", "") if resource.get("type") else ""
    return {
        "event_type": "encounter",
        "date": _parse_date(resource.get("period", {}).get("start")),
        "description": display or _decode_code(system, code) or "Clinical encounter",
        "code": code,
        "class": resource.get("class", {}).get("code", ""),
    }


def normalize_document_reference(resource: dict[str, Any]) -> dict[str, Any]:
    content = resource.get("content", [{}])[0]
    attachment = content.get("attachment", {})
    return {
        "event_type": "note",
        "date": _parse_date(resource.get("date")),
        "description": attachment.get("title", "Clinical note"),
        "content_type": attachment.get("contentType", ""),
        "url": attachment.get("url", ""),
    }


_NORMALIZERS = {
    "Condition": normalize_condition,
    "Observation": normalize_observation,
    "MedicationRequest": normalize_medication_request,
    "Encounter": normalize_encounter,
    "DocumentReference": normalize_document_reference,
}


def normalize_all(raw: dict[str, list[dict[str, Any]]]) -> dict[str, Any]:
    """Normalize a full get_all_resources response into a flat structured dict."""
    patient_list = raw.get("Patient", [])
    patient = normalize_patient(patient_list[0]) if patient_list else {}

    events: list[dict[str, Any]] = []
    for resource_type, normalizer in _NORMALIZERS.items():
        for resource in raw.get(resource_type, []):
            try:
                events.append(normalizer(resource))
            except Exception:
                pass  # malformed resources are skipped silently

    events.sort(key=lambda e: e.get("date", "") or "")
    return {"patient": patient, "events": events}
