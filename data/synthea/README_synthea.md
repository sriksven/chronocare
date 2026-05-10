# Synthea (optional)

The current demo does **not** use Synthea, the demo bundle [`tests/fixtures/demo_patient_fhir.json`](../../tests/fixtures/demo_patient_fhir.json) is a hand-curated 57-resource FHIR R4 bundle for John Doe (HTN → T2DM → CKD progression, 2019-2026). It uploads to any FHIR R4 server in seconds via [`scripts/upload_fhir_bundle.py`](../../scripts/upload_fhir_bundle.py).

Synthea is documented here as an alternative for generating additional synthetic patients if you want more variety than the single bundled demo case.

## Install

Requires Java 11+.

```bash
git clone https://github.com/synthetichealth/synthea
cd synthea
```

## Generate patients

```bash
./run_synthea -p 10 Massachusetts Boston \
  --exporter.fhir.export=true \
  --exporter.baseDirectory=../chronocare/data/synthea/output
```

## Upload to a FHIR server

For HAPI public R4 (no auth, demo target):
```bash
python scripts/upload_fhir_bundle.py \
  --bundle data/synthea/output/fhir/<bundle>.json \
  --fhir-url https://hapi.fhir.org/baseR4 \
  --token ""   # HAPI public is auth-free
```

For an authenticated FHIR server (e.g. Prompt Opinion FHIR workspace):
```bash
python scripts/upload_fhir_bundle.py \
  --bundle data/synthea/output/fhir/<bundle>.json \
  --fhir-url "$FHIR_BASE_URL" \
  --token "$FHIR_TOKEN"
```

The script prints each created resource's location header, grab the Patient ID from there.
