# ChronoCare, Status

**Last updated:** 2026-05-09
**Deadline:** 2026-05-11
**Live URL:** `https://attractive-ambition-production-5fd7.up.railway.app/mcp/`

---

## TL;DR

End-to-end pipeline **verified working in production**. ChronoCore agent on Prompt Opinion successfully chains all 13 tools, fetches data from HAPI public R4 FHIR, runs 8 LLM calls (GPT-4o + Llama-3.3-70b), and returns a unified clinical brief in 25-35 seconds.

Remaining work is non-code: demo recording, Devpost submission, first git commit.

---

## What's Built

### Source Code (`src/chronocare/`)

All 14 MCP tools implemented, deployed, and verified end-to-end via live tool calls.

**`tools/time_traveler.py`**, Tools 1-4
- `get_full_patient_history`: parallel FHIR fetch (7 resource types), code normalization, TTL cache
- `order_events_chronologically`: pure Python sort + dedup
- `identify_clinical_turning_points`: → Groq Llama-3.3-70b
- `generate_patient_narrative`: → OpenAI GPT-4o

**`tools/deterioration.py`**, Tools 5-7
- `get_recent_signals`: filters timeline to past N days (default 90)
- `analyze_weak_patterns`: → OpenAI GPT-4o (deepest reasoning step)
- `generate_early_warning_report`: → Groq Llama-3.3-70b

**`tools/root_cause.py`**, Tools 8-9
- `correlate_events`: → Groq Llama-3.3-70b
- `generate_causal_hypothesis`: → OpenAI GPT-4o

**`tools/recommendations.py`**, Tools 10-12
- `map_comorbidities`: → Groq Llama-3.3-70b
- `match_clinical_guidelines`: → OpenAI GPT-4o-mini
- `generate_recommendations`: → OpenAI GPT-4o

**`tools/synthesis.py`**, Tool 13
- `generate_unified_brief`: pure Python assembly; no LLM call

**`voice/tts.py`**, Tool 14
- `text_to_speech_brief`: OpenAI TTS primary (model `tts-1`, voice `alloy`); Google Cloud TTS fallback if `GOOGLE_TTS_API_KEY` set

**`fhir/client.py`**
- Async FHIR R4 REST client (`httpx.AsyncClient`)
- Optional Bearer auth: header omitted entirely if `FHIR_TOKEN` is empty (so HAPI public works auth-free)
- 404 handled gracefully (empty list, no crash)

**`fhir/normalizer.py`**
- Decodes LOINC → lab names, ICD-10 → condition names, RxNorm → drug names
- Falls back to raw code on miss
- Produces flat sorted `events` list, the single shape all reasoning tools consume

**`fhir/cache.py`**
- 38-line in-memory TTL cache; default 300s

**`reasoning/llm_client.py`**
- Multi-provider routing via `backend=` parameter (`"groq"`, `"openai"`, `"openai-mini"`)
- 3-attempt retry with exponential backoff on rate-limits and API errors
- Logs model, token counts, latency per call; never logs prompt content

**`reasoning/prompts.py`**
- 9 prompt templates as pure functions returning `(system, user)`
- Explicit anti-hallucination guards: "Only reference findings present in the data provided"

**`utils/config.py`**
- Loads + validates env vars at startup; fails fast with the missing-var list

**`utils/logging.py`**
- `structlog` JSON output
- `hash_patient_id()`, SHA-256 prefix; raw IDs never logged

**`server.py`**
- 14 tools registered with full JSON schemas
- Streamable HTTP transport (Prompt Opinion requirement)
- Per-request FHIR context via `X-FHIR-Server-URL` / `X-FHIR-Access-Token` headers
- Health: `GET /health` → `{"status": "ok", "tools_count": 14, "llm_backend": "gpt-4o+groq-llama3.3"}`

---

### Tests (`tests/`)

**42 passing tests**, unit + integration, all green:

- `test_cache.py`, TTL expiry, set/get, invalidate, clear
- `test_normalizer.py`, each resource type, empty inputs, chronological sort, malformed data
- `test_time_traveler.py`, sort, dedup, sparse timeline, LLM success + failure
- `test_deterioration.py`, date filtering, empty signals, medium risk detection, LLM fallback
- `test_synthesis.py`, required keys, patient summary, schema version, ISO timestamp
- `test_full_pipeline.py`, full 13-tool chain on the demo fixture (mocked LLM)

**Demo fixture** (`tests/fixtures/demo_patient_fhir.json`): fully synthetic 57-resource FHIR R4 bundle. John Doe, 62yo male: HTN (2019), T2DM (2020), CKD Stage 2 (2022), Creatinine 1.3, BP 138/88, HbA1c 7.8%, Lisinopril, Metformin.

---

### Infrastructure

- **Dockerfile**, `python:3.11-slim`, deps cached layer, healthcheck on `/health`
- **docker-compose.yml**, single service, env file mount
- **`.github/workflows/deploy.yml`**, `pytest` on push to `main`; deploys via Railway CLI if tests pass
- **`pyproject.toml`**, `pytest-asyncio` auto mode, version 1.0.0
- **`requirements.txt`**, pinned: `mcp`, `httpx`, `uvicorn`, `starlette`, `openai`, `groq`, `structlog`, `slowapi`, `fhir.resources`, `pytest`, `pytest-asyncio`
- **`.env.example`**, documents all env vars (required + optional)

---

### Data (`data/`)

- `code_mappings/loinc.json`, 37 codes (labs, vitals, BMI, CBC, CMP, lipids, HbA1c, eGFR)
- `code_mappings/icd10.json`, 32 codes (HTN, CKD stages, T2DM, COPD, heart failure, lipid disorders)
- `code_mappings/rxnorm.json`, 30 codes (Lisinopril, Metformin, Atorvastatin, Empagliflozin, Warfarin, Apixaban, etc.)
- `synthea/README_synthea.md`, optional Synthea instructions (current demo doesn't use Synthea)

---

### Scripts (`scripts/`)

- `upload_fhir_bundle.py`, POST a FHIR transaction bundle; prints created Patient ID
- `test_mcp_connection.py`, smoke test against the live deploy; verifies all 14 tools enumerate (Streamable HTTP + SSE compatible)

---

## Production State

### Verified working in Prompt Opinion
| Component | Status | Evidence |
|---|---|---|
| Railway MCP server | ✅ Live | `/health` returns 200 with 14 tools |
| FHIR data layer | ✅ Working | All 7 FHIR resource types fetched from HAPI per call |
| Multi-model LLM routing | ✅ Working | Logs show 8 distinct LLM calls in 25s window across gpt-4o, gpt-4o-mini, llama-3.3-70b |
| MCP server registered in PO | ✅ | "PromptOpinion FHIR Context Supported" badge shown |
| ChronoCore agent | ✅ Created | A2A Enabled, model `openai/gpt-4.1`, all 14 tools attached |
| End-to-end smoke test | ✅ Passed | "I need a full clinical analysis of demo patient..." → full chain executed in PO General Chat |

### Verified clinical output
The narrative cites real patient data: "March 12, 2019, with a diagnosis of hypertension, evidenced by a blood pressure reading of 148/92. On this date, their creatinine level was 0.9 mg/dL, eGFR was 88 mL/min/1.73m², and BMI was 28.4 kg/m²..."

---

## Remaining Work

| # | Task | Owner |
|---|---|---|
| 1 | Record 3-min demo video | user |
| 2 | Write Devpost description + submit | user |

Deadline: 2026-05-11.

---

## What's shipped beyond the original spec

These were added during the build:

- **React/Vite frontend** (`frontend/`), 5 routes: Landing, How it works, Tools catalog, Live demo, Admin dashboard. Hand-crafted clinical aesthetic with custom Tailwind theme. Animated SVG hero on the landing page.
- **`POST /api/demo/analyze`**, public endpoint that runs the full 13-step pipeline server-side. Used by the React `/demo` page so visitors can test the system without Prompt Opinion.
- **`POST /api/admin/patients`**, admin endpoint for adding new patients. Auth via `X-Admin-Key` header (matches `ADMIN_KEY` env var). Used by the React `/admin` page.
- **CLI admin tool** (`scripts/admin_add_patient.py`), command-line equivalent of the admin dashboard for bulk/automated ingestion.
- **Patient picker UI**, Demo page shows all 4 demo patients (John, Maria, Robert, Sarah) as selectable cards.
- **Patient generator** (`scripts/generate_demo_patients.py`), reproducible synthetic FHIR bundle generation.
- **CI/CD**, `Frontend / GitHub Pages` builds Vite app, deploys to Pages, smoke-tests live URL. `Backend / Tests` runs pytest, smoke-tests live Railway endpoints. Path-filtered triggers prevent unnecessary cross-runs.

---

## How To Run Locally

```bash
cp .env.example .env
# Fill in OPENAI_API_KEY, GROQ_API_KEY, MCP_API_KEY, FHIR_BASE_URL

docker compose up --build      # http://localhost:8000

pip install -r requirements.txt
pytest tests/ -v               # 42 tests, all green
```

## How To Deploy

```bash
railway up --detach
railway variables --set "FHIR_BASE_URL=https://hapi.fhir.org/baseR4"
```

Then run the smoke test to verify:
```bash
python scripts/test_mcp_connection.py \
  --url https://attractive-ambition-production-5fd7.up.railway.app \
  --key "$MCP_API_KEY"
```
