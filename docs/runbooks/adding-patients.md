# Admin: Adding a new demo patient

There are **two interfaces** for adding patients:

- **Admin dashboard** (browser): https://sriksven.github.io/chronocare/#/admin -
  paste a FHIR bundle, click upload, done. Requires the admin key
  (`ADMIN_KEY` env var on the Railway server).
- **CLI** (terminal): `python3 scripts/admin_add_patient.py <bundle.json>` -
  same logic; convenient for batch ingestion or generated bundles.

Both call the same backend endpoint and produce identical results. Pick
whichever fits the moment. The bundle source can be hand-written, Synthea-
generated, or an external (de-identified) export.

## Quick reference

```
                                   ┌─ Synthea generator (realistic, time-consuming)
Source of patient data ────────────┼─ Hand-written bundle (full control, our default)
                                   └─ Real EHR export (requires de-identification)

                ↓

   FHIR R4 transaction Bundle (must contain a Patient resource with an id)

                ↓
   ┌──────────────────────────┐         ┌──────────────────────────────┐
   │  Admin dashboard          │   or    │  CLI                         │
   │  /admin page in frontend  │         │  scripts/admin_add_patient   │
   └──────────────┬───────────┘         └──────────────┬───────────────┘
                  └────────────── same backend ─────────┘
                                  ↓
   ┌─────────────────────────┬────────────────────────────────────┐
   │ Uploaded to FHIR server │ Registered in frontend catalog     │
   │ (HAPI public by default)│ (only via CLI --register flag, or  │
   │                         │  manual edit of patients.ts)        │
   └─────────────────────────┴────────────────────────────────────┘
```

---

## Option 0, Admin dashboard (no terminal needed)

1. Open **https://sriksven.github.io/chronocare/#/admin**
2. Enter the admin key (the value of `ADMIN_KEY` set on Railway -
   set via `railway variables --set "ADMIN_KEY=..."`).
   The key is stored in `localStorage` so you only enter it once per browser.
3. Either:
   - **Upload .json**, pick a FHIR bundle file
   - **Paste JSON**, drop the bundle into the textarea
   - **Insert sample**, load a minimal bundle to see the format
4. Click **Add patient →**.
5. The dashboard displays the resulting Patient ID, FHIR URL, and how many
   entries were uploaded.

**Note:** The dashboard's add-patient flow uploads to the FHIR server but
does **not** automatically update the frontend catalog (`patients.ts`).
To make the new patient appear in the picker on `/demo`, also append a
row to `frontend/src/lib/patients.ts` and rebuild. For full automation,
use the CLI with the `--register` flag.

---

## Option A, Hand-written bundle (recommended for the demo)

This is what we used for the four demo patients. Each is reproducible from
[`scripts/generate_demo_patients.py`](../../scripts/generate_demo_patients.py).
To add a new one:

1. Edit [`scripts/generate_demo_patients.py`](../../scripts/generate_demo_patients.py)
   - Add a new function (e.g. `def jane_kim() -> dict: ...`) following the
     pattern of `maria()` / `robert()` / `sarah()`. Use the helpers
     `patient`, `encounter`, `condition`, `observation`, `bp`, `med`,
     `diagnostic` to keep entries valid.
   - Add a row to the `PATIENTS` list at the bottom.

2. Generate the bundle:

   ```bash
   python3 scripts/generate_demo_patients.py
   ```

   This writes `tests/fixtures/<name>_fhir.json` and updates the frontend
   catalog at [`frontend/src/lib/patients.ts`](../../frontend/src/lib/patients.ts).

3. Upload to the FHIR server:

   ```bash
   python3 scripts/admin_add_patient.py tests/fixtures/jane_kim_fhir.json
   ```

4. Rebuild + deploy the frontend:

   ```bash
   cd frontend && npm run build
   git add -A && git commit -m "feat: add Jane Kim demo patient" && git push
   ```

   GitHub Actions redeploys the site automatically.

---

## Option B, Synthea-generated bundle

Synthea produces realistic synthetic patients with full history. Slower
than hand-writing but no data design needed. See
[`data/synthea/README_synthea.md`](../../data/synthea/README_synthea.md)
for setup. Once you have a bundle file from Synthea:

```bash
python3 scripts/admin_add_patient.py path/to/synthea-output/john-smith.json \
  --register \
  --age 67 \
  --story "Synthea-generated CHF + diabetes patient with 8 years of history" \
  --conditions "heart failure,type 2 diabetes,hypertension"
```

---

## Option C, Bundle from an external source

If you have a FHIR R4 transaction Bundle from any source (real EHR export,
public dataset, etc.):

1. **De-identify it.** Strip names, addresses, phone, MRN. Keep only the
   clinical content needed for reasoning. Verify there is no PHI before
   uploading anywhere.

2. Make sure the Patient resource has an `id` field. If it doesn't, add
   one (any UUID).

3. Run the same command as Option B.

---

## What `admin_add_patient.py` actually does

```bash
python3 scripts/admin_add_patient.py <bundle.json>
```

1. **Validates** the bundle is a FHIR R4 transaction Bundle with exactly
   one Patient resource that has an `id` field.
2. **Rewrites** all `POST` entries to `PUT /<ResourceType>/<id>` so the
   FHIR server preserves the IDs you supplied. (Without this, internal
   references like `Patient/abc` break because the server allocates new
   IDs.)
3. **Uploads** to `https://hapi.fhir.org/baseR4` by default. Override with
   `--fhir-url` and `--fhir-token` for an authenticated server.
4. **Reports** how many entries were created/updated (200/201) vs. failed.
5. With `--register`, **appends** the patient to
   `frontend/src/lib/patients.ts` so the Demo page picker shows them.

The script is **idempotent**, re-running with the same bundle just updates
the existing resources (PUT semantics).

---

## Targeting a different FHIR server

The default is HAPI's public sandbox. To upload to your own FHIR server:

```bash
python3 scripts/admin_add_patient.py bundle.json \
  --fhir-url https://your-fhir-server.example.com/fhir \
  --fhir-token "$FHIR_BEARER_TOKEN"
```

If your MCP server should also point at this FHIR server, update the
Railway env var:

```bash
railway variables --set "FHIR_BASE_URL=https://your-fhir-server.example.com/fhir" \
                  --set "FHIR_TOKEN=$FHIR_BEARER_TOKEN"
railway up --detach
```

The MCP server passes per-request `X-FHIR-Server-URL` headers from
Prompt Opinion (when the FHIR Context extension is enabled), which
override the env-var default. So you can also leave the env vars alone
and let Prompt Opinion inject the FHIR endpoint at runtime.

---

## Verifying after upload

```bash
# Confirm Patient is retrievable
curl 'https://hapi.fhir.org/baseR4/Patient/<patient-id>' \
  -H 'Accept: application/fhir+json' | jq

# Confirm Observations searchable
curl 'https://hapi.fhir.org/baseR4/Observation?patient=<patient-id>&_summary=count' \
  -H 'Accept: application/fhir+json'

# Run the full ChronoCare pipeline against the new patient
curl -X POST https://attractive-ambition-production-5fd7.up.railway.app/api/demo/analyze \
  -H 'Content-Type: application/json' \
  -d '{"patient_id": "<patient-id>"}' \
  --max-time 120
```

Or open the live demo and pick the patient from the catalog:
**https://sriksven.github.io/chronocare/#/demo**

---

## Removing a patient

1. Delete the bundle file from `tests/fixtures/` (or just stop including it).
2. Remove the row from `frontend/src/lib/patients.ts` (or re-run the
   generator script after removing them from the `PATIENTS` list).
3. Optionally delete from HAPI:
   ```bash
   curl -X DELETE https://hapi.fhir.org/baseR4/Patient/<patient-id>
   ```
   (HAPI public also auto-purges occasionally, re-upload if needed.)
4. Rebuild + push the frontend.
