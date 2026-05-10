"""Generate three additional synthetic FHIR R4 patient bundles for the demo.

Each bundle is fully synthetic — no real PHI. Each represents a distinct
clinical archetype that exercises different parts of the ChronoCare pipeline:

  - maria_rodriguez   : T2DM poor control + cardiovascular risk
  - robert_chen       : CHF + AFib + COPD (cardiorenal-pulmonary triad)
  - sarah_williams    : Pre-diabetes + borderline HTN (low-risk control case)

Output: tests/fixtures/{patient}_fhir.json
        frontend/src/lib/patients.ts (catalog for the UI)
"""

from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).parent.parent
FIXTURES = ROOT / "tests" / "fixtures"
FIXTURES.mkdir(parents=True, exist_ok=True)


def patient(pid: str, family: str, given: str, dob: str, gender: str, city: str) -> dict:
    return {
        "resource": {
            "resourceType": "Patient",
            "id": pid,
            "name": [{"family": family, "given": [given]}],
            "birthDate": dob,
            "gender": gender,
            "address": [{"city": city, "state": "MA"}],
        },
        "request": {"method": "POST", "url": "Patient"},
    }


def encounter(pid: str, eid: str, date: str, reason: str, klass: str = "AMB") -> dict:
    return {
        "resource": {
            "resourceType": "Encounter",
            "id": eid,
            "status": "finished",
            "class": {"code": klass},
            "subject": {"reference": f"Patient/{pid}"},
            "period": {"start": date, "end": date},
            "reasonCode": [{"text": reason}],
        },
        "request": {"method": "POST", "url": "Encounter"},
    }


def condition(pid: str, cid: str, code: str, display: str, onset: str, status: str = "active") -> dict:
    return {
        "resource": {
            "resourceType": "Condition",
            "id": cid,
            "subject": {"reference": f"Patient/{pid}"},
            "clinicalStatus": {"coding": [{"code": status}]},
            "code": {
                "coding": [{"system": "http://hl7.org/fhir/sid/icd-10", "code": code, "display": display}],
                "text": display,
            },
            "onsetDateTime": onset,
        },
        "request": {"method": "POST", "url": "Condition"},
    }


def observation(
    pid: str,
    oid: str,
    loinc: str,
    name: str,
    value: float | str,
    unit: str,
    date: str,
    component: list[dict] | None = None,
) -> dict:
    res = {
        "resourceType": "Observation",
        "id": oid,
        "status": "final",
        "code": {
            "coding": [{"system": "http://loinc.org", "code": loinc, "display": name}],
            "text": name,
        },
        "subject": {"reference": f"Patient/{pid}"},
        "effectiveDateTime": date,
    }
    if component:
        res["component"] = component
    elif isinstance(value, str):
        res["valueString"] = value
    else:
        res["valueQuantity"] = {"value": value, "unit": unit, "system": "http://unitsofmeasure.org", "code": unit}
    return {"resource": res, "request": {"method": "POST", "url": "Observation"}}


def bp(pid: str, oid: str, systolic: int, diastolic: int, date: str) -> dict:
    """Convenience: blood pressure as a single Observation with two components."""
    return observation(
        pid, oid, "85354-9", "Blood pressure panel", value="",
        unit="", date=date,
        component=[
            {
                "code": {"coding": [{"system": "http://loinc.org", "code": "8480-6", "display": "Systolic blood pressure"}]},
                "valueQuantity": {"value": systolic, "unit": "mm[Hg]"},
            },
            {
                "code": {"coding": [{"system": "http://loinc.org", "code": "8462-4", "display": "Diastolic blood pressure"}]},
                "valueQuantity": {"value": diastolic, "unit": "mm[Hg]"},
            },
        ],
    )


def med(pid: str, mid: str, rxnorm: str, drug: str, date: str, status: str = "active") -> dict:
    return {
        "resource": {
            "resourceType": "MedicationRequest",
            "id": mid,
            "status": status,
            "intent": "order",
            "subject": {"reference": f"Patient/{pid}"},
            "authoredOn": date,
            "medicationCodeableConcept": {
                "coding": [{"system": "http://www.nlm.nih.gov/research/umls/rxnorm", "code": rxnorm, "display": drug}],
                "text": drug,
            },
        },
        "request": {"method": "POST", "url": "MedicationRequest"},
    }


def diagnostic(pid: str, did: str, name: str, date: str, conclusion: str) -> dict:
    return {
        "resource": {
            "resourceType": "DiagnosticReport",
            "id": did,
            "status": "final",
            "code": {"text": name},
            "subject": {"reference": f"Patient/{pid}"},
            "effectiveDateTime": date,
            "conclusion": conclusion,
        },
        "request": {"method": "POST", "url": "DiagnosticReport"},
    }


def bundle(entries: list[dict]) -> dict:
    return {"resourceType": "Bundle", "type": "transaction", "entry": entries}


# =============================================================================
# Patient 1: Maria Rodriguez — T2DM poor control + cardiovascular risk
# =============================================================================

def maria() -> dict:
    pid = "a8c2f1d5-3e6b-4a91-9c4f-2d8e7b0a5f3c"
    e: list[dict] = [patient(pid, "Rodriguez", "Maria", "1968-02-22", "female", "Worcester")]

    # 2020 diagnosis
    e.append(encounter(pid, "mr-enc-2020-04", "2020-04-15", "Annual physical — fatigue, polyuria"))
    e.append(condition(pid, "mr-cond-t2dm", "E11.9", "Type 2 diabetes mellitus", "2020-04-15"))
    e.append(observation(pid, "mr-obs-hba1c-2020", "4548-4", "HbA1c", 8.2, "%", "2020-04-15"))
    e.append(observation(pid, "mr-obs-glucose-2020", "2339-0", "Fasting glucose", 178, "mg/dL", "2020-04-15"))
    e.append(bp(pid, "mr-obs-bp-2020", 138, 88, "2020-04-15"))
    e.append(observation(pid, "mr-obs-bmi-2020", "39156-5", "BMI", 31.2, "kg/m2", "2020-04-15"))

    # 2021 — Metformin started
    e.append(encounter(pid, "mr-enc-2021-05", "2021-05-22", "Diabetes follow-up"))
    e.append(med(pid, "mr-med-metformin", "860975", "Metformin 500mg BID", "2021-05-22"))
    e.append(observation(pid, "mr-obs-hba1c-2021", "4548-4", "HbA1c", 7.8, "%", "2021-05-22"))
    e.append(observation(pid, "mr-obs-ldl-2021", "13457-7", "LDL cholesterol", 142, "mg/dL", "2021-05-22"))

    # 2022 — Worsening control
    e.append(encounter(pid, "mr-enc-2022-03", "2022-03-10", "Quarterly diabetes review"))
    e.append(observation(pid, "mr-obs-hba1c-2022", "4548-4", "HbA1c", 9.1, "%", "2022-03-10"))
    e.append(condition(pid, "mr-cond-htn", "I10", "Essential hypertension", "2022-03-10"))
    e.append(bp(pid, "mr-obs-bp-2022", 146, 92, "2022-03-10"))
    e.append(observation(pid, "mr-obs-creat-2022", "2160-0", "Creatinine", 1.0, "mg/dL", "2022-03-10"))

    # 2023 — SGLT2 added
    e.append(encounter(pid, "mr-enc-2023-04", "2023-04-08", "Adding SGLT2 inhibitor"))
    e.append(med(pid, "mr-med-empagliflozin", "1545653", "Empagliflozin 10mg daily", "2023-04-08"))
    e.append(med(pid, "mr-med-lisinopril", "314076", "Lisinopril 10mg daily", "2023-04-08"))
    e.append(observation(pid, "mr-obs-hba1c-2023", "4548-4", "HbA1c", 8.4, "%", "2023-04-08"))
    e.append(observation(pid, "mr-obs-ldl-2023", "13457-7", "LDL cholesterol", 138, "mg/dL", "2023-04-08"))

    # 2024-25 — Slow improvement
    e.append(encounter(pid, "mr-enc-2024-02", "2024-02-19", "6-month follow-up"))
    e.append(observation(pid, "mr-obs-hba1c-2024", "4548-4", "HbA1c", 7.9, "%", "2024-02-19"))
    e.append(bp(pid, "mr-obs-bp-2024", 134, 84, "2024-02-19"))
    e.append(observation(pid, "mr-obs-creat-2024", "2160-0", "Creatinine", 1.1, "mg/dL", "2024-02-19"))
    e.append(observation(pid, "mr-obs-egfr-2024", "33914-3", "eGFR", 72, "mL/min/1.73m2", "2024-02-19"))
    e.append(observation(pid, "mr-obs-uacr-2024", "14959-1", "Urine albumin/creatinine ratio", 38, "mg/g", "2024-02-19"))

    # 2025
    e.append(encounter(pid, "mr-enc-2025-08", "2025-08-12", "Annual labs"))
    e.append(observation(pid, "mr-obs-hba1c-2025", "4548-4", "HbA1c", 7.5, "%", "2025-08-12"))
    e.append(observation(pid, "mr-obs-ldl-2025", "13457-7", "LDL cholesterol", 145, "mg/dL", "2025-08-12"))
    e.append(observation(pid, "mr-obs-bmi-2025", "39156-5", "BMI", 31.0, "kg/m2", "2025-08-12"))
    e.append(med(pid, "mr-med-atorva", "617310", "Atorvastatin 40mg daily", "2025-08-12"))

    # 2026 — recent
    e.append(encounter(pid, "mr-enc-2026-03", "2026-03-15", "Quarterly diabetes review"))
    e.append(observation(pid, "mr-obs-hba1c-2026", "4548-4", "HbA1c", 7.6, "%", "2026-03-15"))
    e.append(bp(pid, "mr-obs-bp-2026", 132, 82, "2026-03-15"))
    e.append(observation(pid, "mr-obs-creat-2026", "2160-0", "Creatinine", 1.2, "mg/dL", "2026-03-15"))
    e.append(observation(pid, "mr-obs-egfr-2026", "33914-3", "eGFR", 68, "mL/min/1.73m2", "2026-03-15"))
    e.append(observation(pid, "mr-obs-uacr-2026", "14959-1", "Urine albumin/creatinine ratio", 52, "mg/g", "2026-03-15"))
    e.append(diagnostic(pid, "mr-dx-cmp-2026", "Comprehensive metabolic panel", "2026-03-15",
                        "Stable creatinine. eGFR mildly reduced. UACR rising — early diabetic nephropathy."))

    return bundle(e)


# =============================================================================
# Patient 2: Robert Chen — CHF + AFib + COPD (cardiorenal-pulmonary triad)
# =============================================================================

def robert() -> dict:
    pid = "b3e7d2a8-9f4c-4b1e-8a6d-c5f2b9e0a4d7"
    e: list[dict] = [patient(pid, "Chen", "Robert", "1955-09-10", "male", "Cambridge")]

    # 2018 COPD
    e.append(encounter(pid, "rc-enc-2018-11", "2018-11-04", "Chronic cough, shortness of breath"))
    e.append(condition(pid, "rc-cond-copd", "J44.9", "Chronic obstructive pulmonary disease", "2018-11-04"))
    e.append(diagnostic(pid, "rc-dx-pft-2018", "Pulmonary function test", "2018-11-04",
                        "Moderate COPD. FEV1 65% predicted. FEV1/FVC 0.62."))
    e.append(med(pid, "rc-med-tiotropium", "311054", "Tiotropium 18mcg inhaler daily", "2018-11-04"))

    # 2020 AFib
    e.append(encounter(pid, "rc-enc-2020-06", "2020-06-15", "Palpitations, fatigue"))
    e.append(condition(pid, "rc-cond-afib", "I48.91", "Atrial fibrillation", "2020-06-15"))
    e.append(med(pid, "rc-med-apixaban", "1364430", "Apixaban 5mg BID", "2020-06-15"))
    e.append(med(pid, "rc-med-metoprolol", "866427", "Metoprolol tartrate 25mg BID", "2020-06-15"))
    e.append(bp(pid, "rc-obs-bp-2020", 142, 88, "2020-06-15"))
    e.append(observation(pid, "rc-obs-hr-2020", "8867-4", "Heart rate", 110, "bpm", "2020-06-15"))

    # 2022 CHF exacerbation - hospitalization
    e.append(encounter(pid, "rc-enc-2022-09", "2022-09-22", "Heart failure exacerbation — hospitalized 5 days", klass="IMP"))
    e.append(condition(pid, "rc-cond-chf", "I50.32", "Chronic heart failure with reduced ejection fraction", "2022-09-22"))
    e.append(diagnostic(pid, "rc-dx-echo-2022", "Echocardiogram", "2022-09-22",
                        "LVEF 35%. Moderate global hypokinesis. Mild mitral regurgitation."))
    e.append(observation(pid, "rc-obs-bnp-2022", "30934-4", "BNP", 1250, "pg/mL", "2022-09-22"))
    e.append(observation(pid, "rc-obs-creat-2022", "2160-0", "Creatinine", 1.3, "mg/dL", "2022-09-22"))
    e.append(observation(pid, "rc-obs-spo2-2022", "59408-5", "SpO2", 91, "%", "2022-09-22"))
    e.append(med(pid, "rc-med-carvedilol", "200033", "Carvedilol 12.5mg BID", "2022-09-22"))
    e.append(med(pid, "rc-med-spironolactone", "313096", "Spironolactone 25mg daily", "2022-09-22"))
    e.append(med(pid, "rc-med-lisinopril-rc", "314076", "Lisinopril 5mg daily", "2022-09-22"))
    e.append(med(pid, "rc-med-furosemide", "310429", "Furosemide 40mg daily", "2022-09-22"))

    # 2023 follow-up
    e.append(encounter(pid, "rc-enc-2023-03", "2023-03-12", "CHF follow-up"))
    e.append(observation(pid, "rc-obs-bnp-2023", "30934-4", "BNP", 480, "pg/mL", "2023-03-12"))
    e.append(observation(pid, "rc-obs-creat-2023", "2160-0", "Creatinine", 1.4, "mg/dL", "2023-03-12"))
    e.append(observation(pid, "rc-obs-egfr-2023", "33914-3", "eGFR", 56, "mL/min/1.73m2", "2023-03-12"))
    e.append(observation(pid, "rc-obs-k-2023", "2823-3", "Potassium", 4.6, "mmol/L", "2023-03-12"))

    # 2024
    e.append(encounter(pid, "rc-enc-2024-05", "2024-05-08", "Annual cardiology"))
    e.append(observation(pid, "rc-obs-bnp-2024", "30934-4", "BNP", 620, "pg/mL", "2024-05-08"))
    e.append(observation(pid, "rc-obs-creat-2024", "2160-0", "Creatinine", 1.5, "mg/dL", "2024-05-08"))
    e.append(observation(pid, "rc-obs-egfr-2024", "33914-3", "eGFR", 51, "mL/min/1.73m2", "2024-05-08"))
    e.append(observation(pid, "rc-obs-spo2-2024", "59408-5", "SpO2", 93, "%", "2024-05-08"))

    # 2025
    e.append(encounter(pid, "rc-enc-2025-02", "2025-02-19", "ED visit — dyspnea"))
    e.append(condition(pid, "rc-cond-copd-exac", "J44.1", "COPD with acute exacerbation", "2025-02-19"))
    e.append(observation(pid, "rc-obs-spo2-2025", "59408-5", "SpO2", 88, "%", "2025-02-19"))
    e.append(observation(pid, "rc-obs-bnp-2025", "30934-4", "BNP", 750, "pg/mL", "2025-02-19"))

    # 2026 recent — concerning trend
    e.append(encounter(pid, "rc-enc-2026-03", "2026-03-22", "Multidisciplinary review"))
    e.append(observation(pid, "rc-obs-bnp-2026", "30934-4", "BNP", 920, "pg/mL", "2026-03-22"))
    e.append(observation(pid, "rc-obs-creat-2026", "2160-0", "Creatinine", 1.7, "mg/dL", "2026-03-22"))
    e.append(observation(pid, "rc-obs-egfr-2026", "33914-3", "eGFR", 44, "mL/min/1.73m2", "2026-03-22"))
    e.append(observation(pid, "rc-obs-k-2026", "2823-3", "Potassium", 5.1, "mmol/L", "2026-03-22"))
    e.append(bp(pid, "rc-obs-bp-2026", 124, 78, "2026-03-22"))
    e.append(diagnostic(pid, "rc-dx-cmp-2026", "Comprehensive metabolic panel + BNP", "2026-03-22",
                        "BNP rising despite optimized therapy. Creatinine worsening — cardiorenal syndrome. Potassium upper-normal limit on spironolactone+lisinopril."))

    return bundle(e)


# =============================================================================
# Patient 3: Sarah Williams — Pre-diabetes + borderline HTN (low-risk control)
# =============================================================================

def sarah() -> dict:
    pid = "f4a9c1e6-7b3d-4f82-8e5a-1d6c3f0b9a7e"
    e: list[dict] = [patient(pid, "Williams", "Sarah", "1981-05-30", "female", "Boston")]

    # 2024 — initial concern
    e.append(encounter(pid, "sw-enc-2024-09", "2024-09-12", "Annual physical exam"))
    e.append(condition(pid, "sw-cond-prediabetes", "R73.03", "Prediabetes", "2024-09-12"))
    e.append(observation(pid, "sw-obs-hba1c-2024", "4548-4", "HbA1c", 6.0, "%", "2024-09-12"))
    e.append(observation(pid, "sw-obs-glucose-2024", "2339-0", "Fasting glucose", 108, "mg/dL", "2024-09-12"))
    e.append(bp(pid, "sw-obs-bp-2024", 132, 84, "2024-09-12"))
    e.append(observation(pid, "sw-obs-bmi-2024", "39156-5", "BMI", 27.8, "kg/m2", "2024-09-12"))
    e.append(observation(pid, "sw-obs-ldl-2024", "13457-7", "LDL cholesterol", 128, "mg/dL", "2024-09-12"))

    # 2025 — lifestyle intervention follow-up
    e.append(encounter(pid, "sw-enc-2025-03", "2025-03-04", "Lifestyle modification follow-up"))
    e.append(observation(pid, "sw-obs-hba1c-2025-q1", "4548-4", "HbA1c", 5.9, "%", "2025-03-04"))
    e.append(bp(pid, "sw-obs-bp-2025-q1", 128, 82, "2025-03-04"))
    e.append(observation(pid, "sw-obs-bmi-2025-q1", "39156-5", "BMI", 26.9, "kg/m2", "2025-03-04"))

    e.append(encounter(pid, "sw-enc-2025-09", "2025-09-15", "6-month re-check"))
    e.append(observation(pid, "sw-obs-hba1c-2025-q3", "4548-4", "HbA1c", 5.7, "%", "2025-09-15"))
    e.append(bp(pid, "sw-obs-bp-2025-q3", 124, 78, "2025-09-15"))
    e.append(observation(pid, "sw-obs-bmi-2025-q3", "39156-5", "BMI", 26.0, "kg/m2", "2025-09-15"))
    e.append(observation(pid, "sw-obs-ldl-2025", "13457-7", "LDL cholesterol", 115, "mg/dL", "2025-09-15"))

    # 2026 — well controlled
    e.append(encounter(pid, "sw-enc-2026-04", "2026-04-22", "Annual physical"))
    e.append(observation(pid, "sw-obs-hba1c-2026", "4548-4", "HbA1c", 5.6, "%", "2026-04-22"))
    e.append(observation(pid, "sw-obs-glucose-2026", "2339-0", "Fasting glucose", 95, "mg/dL", "2026-04-22"))
    e.append(bp(pid, "sw-obs-bp-2026", 122, 76, "2026-04-22"))
    e.append(observation(pid, "sw-obs-bmi-2026", "39156-5", "BMI", 25.4, "kg/m2", "2026-04-22"))
    e.append(observation(pid, "sw-obs-ldl-2026", "13457-7", "LDL cholesterol", 108, "mg/dL", "2026-04-22"))
    e.append(observation(pid, "sw-obs-creat-2026", "2160-0", "Creatinine", 0.9, "mg/dL", "2026-04-22"))
    e.append(diagnostic(pid, "sw-dx-cmp-2026", "Comprehensive metabolic panel", "2026-04-22",
                        "Excellent response to lifestyle intervention. HbA1c trending toward normal range. BP improved without medication."))

    return bundle(e)


PATIENTS = [
    ("d0be5a00-57c5-4417-adeb-824beb93e4c3", "John Doe", "62", "male",
     "HTN diagnosed 2019 → CKD progression by 2022. Silent multi-year cardiometabolic cascade.",
     ["hypertension", "type 2 diabetes", "chronic kidney disease"], "demo_patient_fhir.json", None),
    ("a8c2f1d5-3e6b-4a91-9c4f-2d8e7b0a5f3c", "Maria Rodriguez", "58", "female",
     "T2DM since 2020, struggled with control until SGLT2 added in 2023. UACR rising — early nephropathy.",
     ["type 2 diabetes", "hypertension", "early diabetic nephropathy", "dyslipidemia"],
     "maria_rodriguez_fhir.json", maria),
    ("b3e7d2a8-9f4c-4b1e-8a6d-c5f2b9e0a4d7", "Robert Chen", "71", "male",
     "CHF (EF 35%) + AFib + COPD. Cardiorenal syndrome emerging — BNP rising, eGFR falling on optimized therapy.",
     ["heart failure", "atrial fibrillation", "COPD", "cardiorenal syndrome"],
     "robert_chen_fhir.json", robert),
    ("f4a9c1e6-7b3d-4f82-8e5a-1d6c3f0b9a7e", "Sarah Williams", "45", "female",
     "Prediabetes + borderline HTN caught at 2024 physical. Excellent response to lifestyle intervention — control case.",
     ["prediabetes", "borderline hypertension"], "sarah_williams_fhir.json", sarah),
]


def write_bundle(filename: str, b: dict) -> None:
    path = FIXTURES / filename
    with path.open("w") as f:
        json.dump(b, f, indent=2)
    print(f"  wrote {path.relative_to(ROOT)} — {len(b['entry'])} entries")


def write_catalog() -> None:
    """Write a TS catalog the frontend can import."""
    target = ROOT / "frontend" / "src" / "lib" / "patients.ts"
    rows = []
    for pid, name, age, sex, story, conditions, _, _ in PATIENTS:
        rows.append("  {")
        rows.append(f"    id: {json.dumps(pid)},")
        rows.append(f"    name: {json.dumps(name)},")
        rows.append(f"    age: {json.dumps(age)},")
        rows.append(f"    sex: {json.dumps(sex)},")
        rows.append(f"    story: {json.dumps(story)},")
        rows.append(f"    conditions: {json.dumps(conditions)},")
        rows.append("  },")
    body = (
        "// Auto-generated by scripts/generate_demo_patients.py — do not edit by hand.\n"
        "export interface DemoPatient {\n"
        "  id: string;\n"
        "  name: string;\n"
        "  age: string;\n"
        "  sex: string;\n"
        "  story: string;\n"
        "  conditions: string[];\n"
        "}\n\n"
        "export const DEMO_PATIENTS: DemoPatient[] = [\n"
        + "\n".join(rows)
        + "\n];\n"
    )
    target.write_text(body)
    print(f"  wrote {target.relative_to(ROOT)} — {len(PATIENTS)} patients")


if __name__ == "__main__":
    print("Generating bundles:")
    for pid, name, _, _, _, _, filename, gen in PATIENTS:
        if gen is None:
            continue  # demo patient already exists
        write_bundle(filename, gen())
    print("\nWriting frontend catalog:")
    write_catalog()
    print("\nDone.")
