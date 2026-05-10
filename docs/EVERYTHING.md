# ChronoCare, Everything

Single source of truth. Architecture, code, data, tools, agents, tests,
CI/CD, admin, voice, deployment, env vars, metrics, and what's been
verified live. If something exists in the project, it's documented here.

---

## TL;DR

ChronoCare is a clinical reasoning engine that reconstructs a patient's
full medical story from FHIR data, detects silent deterioration that
single-visit thresholds miss, and synthesizes an evidence-grounded
clinical brief in 25-35 seconds.

- **14 MCP tools** exposed over Streamable HTTP (13 reasoning, 1 optional voice)
- **8 LLM calls per pipeline**, routed across **OpenAI** (GPT-4o, GPT-4o-mini, TTS-1) and **Groq** (Llama-3.3-70b)
- **Python 3.11 backend** on Railway, **React/Vite frontend** on GitHub Pages
- **Two integration surfaces**: this React app (`/api/demo/analyze`) and Prompt Opinion's ChronoCore A2A agent (`/mcp/`)
- **Verified end-to-end** in production with all four synthetic demo patients on HAPI public R4

---

## Live URLs

| Surface | URL |
|---|---|
| Frontend (GitHub Pages) | `https://sriksven.github.io/chronocare/` |
| Backend (Railway) | `https://attractive-ambition-production-5fd7.up.railway.app` |
| MCP endpoint | `/mcp/` (trailing slash required, Streamable HTTP) |
| Public analyze | `POST /api/demo/analyze` |
| Public voice | `POST /api/demo/voice` |
| Admin upload | `POST /api/admin/patients` |
| Health | `GET /health` |
| FHIR data store | `https://hapi.fhir.org/baseR4` (HAPI public R4) |
| Source repo | `https://github.com/sriksven/chronocare` |

---

## Architecture

```
USER (clinician / admin)
  │
  ↓
FRONTEND  ── React app at sriksven.github.io/chronocare
            ── or Prompt Opinion General Chat
  │
  ↓ A2A handoff (Prompt Opinion path)
ChronoCore   (A2A agent on Prompt Opinion, GPT-4.1)
            FHIR Context: patient_id + token injected per request
  │
  ↓ MCP over Streamable HTTP
ChronoCare MCP server  (Railway, Python 3.11)
  │   └── 14 MCP tools at /mcp/
  │   └── Public HTTP shims at /api/demo/* and /api/admin/*
  │
  ├── FHIR R4 client → HAPI public sandbox
  ├── OpenAI         → GPT-4o, GPT-4o-mini, TTS-1
  └── Groq           → llama-3.3-70b-versatile
```

**Four moving parts. Each is replaceable.**

---

## Backend

### Stack

| Component | Choice | Why |
|---|---|---|
| Language | Python 3.11 | First-class OpenAI + Groq SDKs, FHIR ecosystem, structlog |
| Web framework | Starlette + Uvicorn | Async, lightweight, plays nicely with the MCP SDK |
| MCP transport | `mcp.server.streamable_http` | Required by Prompt Opinion |
| HTTP client | `httpx` | Async support, retries, timeouts |
| Logging | `structlog` | JSON output, per-call structured fields, hashed patient IDs |
| Tests | `pytest` + `pytest-asyncio` | 42 tests, all green |

### MCP server entry point

`src/chronocare/server.py`, Starlette app that:
- Mounts the MCP session manager at `/mcp/`
- Exposes auxiliary HTTP routes for the React frontend (`/api/demo/*`, `/api/admin/*`)
- Adds CORS middleware (origin `*`) to support browser calls from GitHub Pages
- Adds a `FHIRContextMiddleware` that reads `X-FHIR-Server-URL` / `X-FHIR-Access-Token` / `X-Patient-ID` headers from every request and stores them in a `ContextVar` for tools to consume
- Logs `FHIR_CONTEXT fhir_url=… patient_id=…` per request

### The 14 tools

The 13-step **reasoning pipeline** (auto-runs when you click Run analysis):

| # | Tool | Engine | Phase | What it does |
|---|---|---|---|---|
| 01 | `get_full_patient_history` | FHIR REST | Reconstruct | Parallel-fetches Patient + 6 resource types, normalizes LOINC/ICD-10/RxNorm, returns a flat sorted timeline |
| 02 | `order_events_chronologically` | Pure Python | Reconstruct | Sorts and dedupes the timeline |
| 03 | `identify_clinical_turning_points` | Llama-3.3-70b | Reconstruct | 3-5 inflection moments with dates and rationale |
| 04 | `generate_patient_narrative` | GPT-4o | Reconstruct | 200-300 word clinical handoff prose |
| 05 | `get_recent_signals` | Pure Python | Detect | Filters timeline to past N days (default 90) |
| 06 | `analyze_weak_patterns` | GPT-4o | Detect | Holistic multi-signal pattern analysis |
| 07 | `generate_early_warning_report` | Llama-3.3-70b | Detect | Structured risk report (level, signals, trend, urgency) |
| 08 | `correlate_events` | GPT-4o-mini | Explain | Identifies plausible causal pairs (cause/effect/confidence/rationale) |
| 09 | `generate_causal_hypothesis` | GPT-4o | Explain | ~150 word causal narrative synthesizing top correlations |
| 10 | `map_comorbidities` | Llama-3.3-70b | Recommend | Condition-condition interaction map |
| 11 | `match_clinical_guidelines` | GPT-4o-mini | Recommend | Cross-checks vs ADA/JNC/KDIGO/ACC-AHA |
| 12 | `generate_recommendations` | GPT-4o | Recommend | 3-5 cited actions with priority/urgency/finding |
| 13 | `generate_unified_brief` | Pure Python | Synthesize | Deterministic JSON assembly (schema v1.0) |

The **optional 14th tool** (on-demand, not in the auto-pipeline):

| # | Tool | Engine | Phase | Where it triggers |
|---|---|---|---|---|
| 14 | `text_to_speech_brief` | OpenAI TTS-1 | Voice | Frontend "Listen to brief" button (calls `/api/demo/voice`), OR direct MCP call from any agent |

### LLM routing

`src/chronocare/reasoning/llm_client.py`:

```python
class LLMClient:
    def call_llm(system, user, max_tokens, analysis, backend):
        # backend ∈ {"groq", "openai", "openai-mini"}
        # analysis=True → temperature 0.2 (reasoning)
        # analysis=False → temperature 0.5 (narrative prose)
```

Why split: GPT-4o is best at narrative + deep reasoning; Llama-3.3-70b is faster and cheaper for structured JSON output where prose quality doesn't matter; GPT-4o-mini handles guideline-lookup-style tasks at lower cost.

Multi-provider also gives **partial-failure resilience**: a transient OpenAI outage doesn't kill the 4 Llama-backed tools.

3-attempt retry with exponential backoff on rate limits and API errors.

### FHIR client

`src/chronocare/fhir/client.py`:

- Async `httpx.AsyncClient`, 10-15s timeouts
- Authorization header is **only** added when `FHIR_TOKEN` is non-empty (so HAPI public works auth-free)
- Resource types fetched: Patient, Condition, Observation, MedicationRequest, Encounter, DocumentReference, DiagnosticReport
- 404 handled gracefully (empty list, not crash)

### Normalizer

`src/chronocare/fhir/normalizer.py`:

- LOINC → lab names (`data/code_mappings/loinc.json`, 37 codes)
- ICD-10 → condition names (`icd10.json`, 32 codes)
- RxNorm → drug names (`rxnorm.json`, 30 codes)
- Falls back to raw code on miss
- Produces flat `events` list with `event_type`, `date`, `description`, etc.

### Cache

`src/chronocare/fhir/cache.py`, 38 lines, in-memory dict + TTL (default 300s). No Redis. ADR-003 explains why.

### HTTP endpoints

| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | `/health` | none | Liveness probe; returns `{status, version, tools_count, llm_backend}` |
| POST | `/mcp/` | `X-ChronoCare-Key` | MCP Streamable HTTP, tool listing + tool calls |
| GET/POST | `/api/demo/analyze` | none (CORS *) | Runs full 13-step pipeline, returns `{ok, brief, trace}` |
| POST | `/api/demo/voice` | none (CORS *) | Synthesizes speech from a brief, returns `{ok, audio_bytes (base64), transcript, backend, supported}` |
| POST | `/api/admin/patients` | `X-Admin-Key` | Validates + uploads a FHIR R4 transaction Bundle |

### Auth

- **MCP**: `X-ChronoCare-Key: <MCP_API_KEY>` header. The `MCP_API_KEY` env var defines what the server accepts. Demo value: `chronocare-dev-key`.
- **Admin**: `X-Admin-Key: <ADMIN_KEY>` header. The `ADMIN_KEY` env var must be set for the admin endpoint to function (otherwise 503).
- **Demo HTTP routes**: public, CORS open. Designed for the static React app to call from GitHub Pages.

---

## Frontend

### Stack

| Component | Version | Notes |
|---|---|---|
| Vite | 5.4.x | Bundler, dev server, build |
| React | 18.3.x | UI |
| TypeScript | 5.6.x | Strict mode |
| Tailwind CSS | 3.4.x | Custom theme (cream paper, deep navy, clinical teal) |
| Framer Motion | 11.x | All animations + scroll reveals |
| React Router | 6.x | HashRouter (GitHub Pages-safe deep links) |

Bundle size: ~360KB JS / ~28KB CSS / gzipped to ~110KB total.

### Pages

| Route | File | Content |
|---|---|---|
| `/` | `Landing.tsx` | Hero, "EHRs answer one question. They miss two." Three Tenses triptych, USP callout, animated pipeline cards, "Built on" grid, CTA |
| `/how` | `HowItWorks.tsx` | "In plain English" 4-step explainer, system diagram, request lifecycle (9-step animated timeline), 14-tools catalog, four-layers deep dive, admin flow swim-lane diagram, demo patient ID copy cards |
| `/demo` | `Demo.tsx` | Patient picker (4 cards), Patient ID + FHIR URL inputs, animated pipeline trace, full brief renderer, "Listen to brief" voice button, raw tool trace |
| `/admin` | `Admin.tsx` | Admin key auth gate (key in localStorage), bundle paste/upload form, target FHIR URL field, success/error result panel, registered patients list |

### Design system

- Background: `#f8f6f1` (cream)
- Paper: `#ffffff`
- Ink: `#0e1622`
- Teal accent: `#1a5762` / deep `#0f3a44` / soft `#d4e5e8`
- Risk colors: low `#19704a`, medium `#a86c14`, high `#9c2f2f`
- Fonts: Source Serif Pro (display, serif), Inter (body, sans), JetBrains Mono (data, code)

Custom utility classes in `src/index.css`:
- `.highlight`, animated underline that draws in 0.4s after content (replaces `<em>` italics across all pages)
- `.tip` / `.tip-body`, hover tooltip
- `.btn-primary` / `.btn-secondary`, consistent CTAs
- `.dotted`, subtle dot-grid background for diagram containers

### State

No global store. Each page owns its state via `useState` / `useRef`.
The admin key persists in `localStorage`. Everything else is derived
or fetched fresh per page load.

---

## Agent integration (Prompt Opinion + ChronoCore)

### What's configured

- **Custom MCP server** registered in Prompt Opinion workspace settings
  - Endpoint: `https://attractive-ambition-production-5fd7.up.railway.app/mcp/`
  - Transport: Streamable HTTP
  - Auth: API Key header `X-ChronoCare-Key: chronocare-dev-key`
  - All 14 tools enumerate; "PromptOpinion FHIR Context Supported" badge shown

- **ChronoCore A2A agent** in the workspace's BYO Agents
  - Model: `openai/gpt-4.1`
  - Allowed Contexts: Patient
  - A2A: Enabled
  - Chat Selectable: Enabled
  - Skill: `analyze_patient_clinical_history`
  - System prompt: see `docs/research/sprint_plan.md` (the 13-step protocol)

### A2A flow

```
User → General Chat → "I need a full clinical analysis of patient d0be5a00…"
        │
        │ A2A skill match: "clinical analysis", "patient brief", "deterioration"
        ↓
ChronoCore agent (GPT-4.1) reads its system prompt
        │
        │ Calls 13 MCP tools in deliberate order
        ↓
ChronoCare MCP server → FHIR + LLMs → unified brief JSON
        │
        ↑ result back to ChronoCore
ChronoCore formats and returns brief in chat
```

### FHIR Context Extension

The ChronoCare server declares a Prompt Opinion `ai.promptopinion/fhir-context` extension that lists required scopes (Patient, Condition, Observation, MedicationRequest, Encounter, DiagnosticReport, DocumentReference). When the extension is enabled in Prompt Opinion, it injects the workspace's FHIR URL and access token into every MCP request via `X-FHIR-Server-URL` and `X-FHIR-Access-Token` headers, which the server reads via the `FHIRContextMiddleware`.

For the public demo (HAPI public R4), the extension is **disabled** so the server falls back to the `FHIR_BASE_URL` env var.

---

## Data

### FHIR data store

**HAPI public R4 sandbox** (`https://hapi.fhir.org/baseR4`). Used because:
- Standard FHIR R4 reference implementation
- No auth required → frictionless demo
- All four demo patients are fully synthetic (no PHI)

The same MCP server can target any FHIR R4 endpoint (Prompt Opinion's workspace FHIR, an Epic/Cerner sandbox, a local HAPI instance) by changing `FHIR_BASE_URL` and `FHIR_TOKEN`.

### Demo patients

| Patient | ID | Clinical archetype |
|---|---|---|
| **John Doe** (62, M) | `d0be5a00-57c5-4417-adeb-824beb93e4c3` | HTN diagnosed 2019 → CKD progression by 2022. The original silent multi-year cardiometabolic cascade. |
| **Maria Rodriguez** (58, F) | `a8c2f1d5-3e6b-4a91-9c4f-2d8e7b0a5f3c` | T2DM since 2020, struggled with control until SGLT2 added 2023. UACR rising, early diabetic nephropathy. |
| **Robert Chen** (71, M) | `b3e7d2a8-9f4c-4b1e-8a6d-c5f2b9e0a4d7` | CHF (EF 35%) + AFib + COPD. Cardiorenal syndrome emerging, BNP rising, eGFR falling. |
| **Sarah Williams** (45, F) | `f4a9c1e6-7b3d-4f82-8e5a-1d6c3f0b9a7e` | Prediabetes + borderline HTN caught at 2024 physical. Lifestyle intervention success. Control case. |

Bundle counts: 57 / 39 / 42 / 25 entries respectively. All generated from `scripts/generate_demo_patients.py` (reproducible). All uploaded to HAPI via `POST → PUT` rewrite so the supplied IDs are preserved.

---

## CI/CD

Two independent pipelines, path-filtered so backend changes don't trigger frontend redeploy and vice versa.

### Backend / Tests (`.github/workflows/deploy.yml`)

Triggers: push to `main` (excluding `frontend/**`, `docs/**`, `*.md`).

Jobs:
1. **`pytest`**, Python 3.11, install requirements, run `pytest tests/ -v`. 42 tests must pass.
2. **`smoke test live deploy`**, runs after tests. Hits the live Railway URL:
   - `/health` returns 200 with `tools_count: 14`
   - `/mcp/` enumerates 14 tools
   - `/api/demo/analyze` OPTIONS preflight returns 200 with CORS headers

**Note on auto-deploy:** The Railway deploy step was removed because we couldn't generate a valid project-scoped Railway token. Backend deploys are manual via `railway up --detach` from a developer machine. CI tests + smoke checks still run on every push, they just don't push code, they verify the last manual deploy.

### Frontend / GitHub Pages (`.github/workflows/pages.yml`)

Triggers: push to `main` touching `frontend/**` or this workflow file.

Jobs:
1. **`build vite app`**, Node 20, `npm ci`, `tsc --noEmit`, `vite build`, verify dist artifacts (HTML contains brand, JS+CSS exist), upload Pages artifact
2. **`deploy to pages`**, `actions/deploy-pages@v4`, configured Pages source: GitHub Actions
3. **`smoke test live site`**, verifies `https://sriksven.github.io/chronocare/` returns 200, contains "ChronoCare", first JS asset loads

Concurrency: `pages` group, cancel-in-progress (only one Pages deploy at a time).

---

## Tests

### Backend (42 total, all passing)

| File | Coverage |
|---|---|
| `tests/unit/test_cache.py` | TTL expiry, set/get, invalidate, clear |
| `tests/unit/test_normalizer.py` | Each FHIR resource type, empty inputs, chronological sort, malformed data |
| `tests/unit/test_time_traveler.py` | Sort, dedup, sparse timeline edge case, LLM success + failure paths |
| `tests/unit/test_deterioration.py` | Date filtering, empty signals, medium risk detection, LLM failure fallback |
| `tests/unit/test_synthesis.py` | Required keys, patient summary, schema version, ISO timestamp |
| `tests/integration/test_full_pipeline.py` | Loads the demo FHIR fixture, runs the full 13-tool chain with mocked LLM, asserts brief structure |

`pyproject.toml` config:
```toml
[tool.pytest.ini_options]
asyncio_mode = "auto"
testpaths = ["tests"]
pythonpath = ["src"]   # critical: lets tests import chronocare.* without pip install -e .
```

### CI smoke tests

Verify the **live deployment** matches expectations. These run on every push to `main` and would catch:
- A bad backend deploy where `/health` is broken
- A regression where tools fall below 14
- A CORS misconfig that would break the GitHub Pages frontend
- A frontend build that ships without the brand or asset bundles

### Manual smoke

```bash
python scripts/test_mcp_connection.py \
  --url https://attractive-ambition-production-5fd7.up.railway.app \
  --key chronocare-dev-key
# expected: "All tools present. MCP server OK."
```

---

## Admin

### Two interfaces

Both call the same backend endpoint and produce identical results.

**A. Admin dashboard** (browser): `https://sriksven.github.io/chronocare/#/admin`
- Auth gate: paste admin key (matches `ADMIN_KEY` env var on Railway)
- Key persists in `localStorage`
- Form: paste JSON or upload `.json` file, optional FHIR URL override
- Insert sample button to see the format
- Success card shows patient ID, entries uploaded, FHIR URL, PUT rewrite count

**B. CLI** (`scripts/admin_add_patient.py`)
```bash
python3 scripts/admin_add_patient.py path/to/bundle.json \
  --register \
  --age 64 \
  --story "..." \
  --conditions "htn,ckd"
```
With `--register`, also appends the patient to `frontend/src/lib/patients.ts` so they appear in the demo picker.

### What both do internally

1. Validate the bundle (must be a FHIR R4 transaction Bundle with exactly one Patient that has an `id`)
2. Rewrite all `POST` entries to `PUT /<ResourceType>/<id>` so the FHIR server preserves the supplied IDs (otherwise internal references break)
3. POST to the configured FHIR server (HAPI by default)
4. Return per-status entry counts and the resulting Patient ID

Idempotent: re-running with the same bundle PUTs over existing data, doesn't create duplicates.

### Patient generation

`scripts/generate_demo_patients.py` produces the 3 non-default demo patients (Maria, Robert, Sarah) programmatically. To add a new demo patient:
1. Edit the script, add a function (`patient + encounter + condition + observation + bp + med + diagnostic` helpers available)
2. Add the row to the `PATIENTS` list at the bottom
3. Run it: writes `tests/fixtures/<name>_fhir.json` and updates `frontend/src/lib/patients.ts`

---

## Voice

The 14th tool (`text_to_speech_brief`) is **optional and on-demand only**. Two ways to trigger it:

### 1. Demo page button

After a brief renders, the patient banner shows a **"Listen to brief"** button:

```
[idle] → click → [synthesizing... spinner]
                  POST /api/demo/voice with the brief
                  ↓
             Backend invokes text_to_speech_brief
                  ↓
             Returns base64 MP3 + transcript
                  ↓
        Frontend decodes → Blob → Audio.play()
                  ↓
              [playing, click to stop]
```

Status line below the banner: *"playing via text_to_speech_brief, OpenAI TTS"*.

### 2. Direct MCP call

```bash
curl -X POST .../mcp/ \
  -H "X-ChronoCare-Key: chronocare-dev-key" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/call",
       "params":{"name":"text_to_speech_brief",
                 "arguments":{"brief":{...},
                              "sections":["narrative","early_warning","recommendations"]}}}'
```

This is the path Prompt Opinion's ChronoCore would use if asked "read me that brief."

### Backend

`src/chronocare/voice/tts.py`, primary backend OpenAI TTS-1 (uses the existing `OPENAI_API_KEY`), Google Cloud TTS as fallback (`GOOGLE_TTS_API_KEY`). If neither is set, returns `supported: false` with the transcript only.

---

## Environment variables

| Variable | Required | Used for |
|---|---|---|
| `OPENAI_API_KEY` | yes | GPT-4o, GPT-4o-mini, TTS-1 |
| `GROQ_API_KEY` | yes | Llama-3.3-70b-versatile |
| `MCP_API_KEY` | yes | MCP endpoint auth (clients send via `X-ChronoCare-Key`) |
| `FHIR_BASE_URL` | yes | Default FHIR server (overridden per-request by `X-FHIR-Server-URL` header) |
| `FHIR_TOKEN` | no | Bearer token for authenticated FHIR servers; omit for HAPI public |
| `ADMIN_KEY` | no | Enables `POST /api/admin/patients` and the `/admin` dashboard. Without it, the endpoint returns 503. |
| `GOOGLE_TTS_API_KEY` | no | Optional fallback voice backend |
| `LOG_LEVEL` | no | Defaults to `INFO` |
| `CACHE_TTL_SECONDS` | no | Defaults to `300` |
| `PORT` | no | Defaults to `8000` (Railway sets this automatically) |

---

## Repo structure

```
chronocare/
├── src/chronocare/
│   ├── server.py                 # MCP server entry + HTTP routes
│   ├── tools/
│   │   ├── time_traveler.py      # Tools 1-4
│   │   ├── deterioration.py      # Tools 5-7
│   │   ├── root_cause.py         # Tools 8-9
│   │   ├── recommendations.py    # Tools 10-12
│   │   └── synthesis.py          # Tool 13
│   ├── reasoning/
│   │   ├── llm_client.py         # Multi-provider routing
│   │   └── prompts.py            # All prompt templates
│   ├── fhir/
│   │   ├── client.py             # Async FHIR R4 client
│   │   ├── normalizer.py         # LOINC/ICD-10/RxNorm decode
│   │   └── cache.py              # In-memory TTL cache
│   ├── voice/tts.py              # Tool 14 (OpenAI + Google fallback)
│   └── utils/
│       ├── config.py             # Env var loading + validation
│       └── logging.py            # Structlog setup, hashed patient IDs
├── tests/
│   ├── unit/                     # 36 unit tests
│   ├── integration/              # 6 integration tests
│   └── fixtures/                 # 4 synthetic demo bundles
├── frontend/
│   ├── src/
│   │   ├── App.tsx               # Layout + nav + footer
│   │   ├── main.tsx              # Router
│   │   ├── pages/
│   │   │   ├── Landing.tsx
│   │   │   ├── HowItWorks.tsx
│   │   │   ├── Demo.tsx
│   │   │   └── Admin.tsx
│   │   ├── lib/
│   │   │   ├── api.ts            # Backend API wrappers
│   │   │   └── patients.ts       # Demo patient catalog
│   │   ├── index.css             # Tailwind + custom utilities
│   │   └── (no global store)
│   ├── package.json, vite.config.ts, tailwind.config.js, tsconfig.json
│   └── public/favicon.svg
├── scripts/
│   ├── admin_add_patient.py      # CLI: validate + upload bundle
│   ├── generate_demo_patients.py # Reproducible bundle generator
│   ├── upload_fhir_bundle.py     # Lower-level upload helper
│   └── test_mcp_connection.py    # Live smoke test
├── data/code_mappings/           # LOINC, ICD-10, RxNorm JSON tables
├── docs/
│   ├── EVERYTHING.md             # ← this file
│   ├── STATUS.md                 # Build status
│   ├── runbooks/                 # deployment.md, debugging.md, adding-patients.md
│   ├── architecture/             # overview.md, data_flow.md
│   ├── api/                      # mcp_tools.md, brief_schema.md
│   ├── adr/                      # 001-python-mcp-server.md, 002-claude-haiku.md (multi-model routing), 003-in-memory-cache.md
│   └── research/                 # clinical_background.md, hackathon_notes.md, sprint_plan.md
├── .github/workflows/
│   ├── deploy.yml                # Backend / Tests
│   └── pages.yml                 # Frontend / GitHub Pages
├── Dockerfile                    # python:3.11-slim, healthcheck on /health
├── docker-compose.yml            # Single service for local dev
├── requirements.txt              # Pinned Python deps
├── pyproject.toml                # Pytest config (pythonpath = src)
├── README.md
└── .env.example                  # All env vars documented
```

---

## Local development

### Backend

```bash
cp .env.example .env
# Fill in OPENAI_API_KEY, GROQ_API_KEY, MCP_API_KEY=anything, FHIR_BASE_URL=https://hapi.fhir.org/baseR4

pip install -r requirements.txt
python -m chronocare.server
# Listens on http://localhost:8000

# In another terminal, run tests
pytest tests/ -v
```

### Frontend

```bash
cd frontend
npm install
npm run dev
# Vite serves at http://localhost:5173/chronocare/
```

In dev mode the frontend points at the **production Railway URL** by default (see `API_BASE` in `lib/api.ts`). Change it locally if you want to hit your local backend.

---

## Deployment

### Backend (Railway)

```bash
railway up --detach
railway variables \
  --set "OPENAI_API_KEY=sk-..." \
  --set "GROQ_API_KEY=gsk_..." \
  --set "MCP_API_KEY=chronocare-dev-key" \
  --set "FHIR_BASE_URL=https://hapi.fhir.org/baseR4" \
  --set "ADMIN_KEY=$(openssl rand -hex 16)"
```

After the deploy settles, smoke test:
```bash
curl https://attractive-ambition-production-5fd7.up.railway.app/health
# {"status":"ok","version":"1.0.0","tools_count":14,"llm_backend":"gpt-4o+groq-llama3.3"}
```

### Frontend (GitHub Pages)

Push to `main` with changes under `frontend/**`. Pages source must be set to "GitHub Actions" in repo settings → Pages.

```bash
git add -A
git commit -m "..."
git push
# Watch the workflow at github.com/sriksven/chronocare/actions
# Site goes live at https://sriksven.github.io/chronocare/ in ~1 min
```

---

## Verified metrics

These are not aspirational. They are observed, in production.

| Metric | Value | How verified |
|---|---|---|
| End-to-end pipeline latency | 25-35s | `/api/demo/analyze` on John Doe, repeated |
| Tools enumerable | 14 | `tools/list` JSON-RPC against `/mcp/` |
| Backend tests passing | 42/42 | `pytest tests/ -v` |
| FHIR resources fetched per request | 7 types in parallel | Logs show 7 GETs to HAPI per `get_full_patient_history` |
| LLM calls per pipeline | 8 distinct | Logs show 8 `llm_call` events with mixed models |
| Frontend bundle (gzipped) | ~110KB total | `vite build` artifact size |
| Frontend route count | 4 | `Landing`, `HowItWorks`, `Demo`, `Admin` |
| Demo patients on HAPI | 4 | All retrievable via `GET /Patient/<id>` |
| Synthetic data | 100% | Generator script + fixtures, no PHI |
| Pipeline success rate | 100% on demo patients | Every `trace` entry returns `ok: true` |

---

## Security notes

- **Patient IDs are hashed (SHA-256 prefix) before logging.** Real IDs never appear in Railway logs.
- **No PHI anywhere.** All four demo patients are fully synthetic. The bundle generator produces fictional names, fictional DOBs, fictional addresses.
- **Secrets are env vars only.** Nothing committed to git. `.env` is gitignored.
- **Admin endpoint is disabled by default** (returns 503 without `ADMIN_KEY`).
- **Demo MCP key is intentionally public** (`chronocare-dev-key`) because the demo data is synthetic. For production deploys, rotate it via `MCP_API_KEY` env var.
- **CORS is `*` on the demo endpoints** because they're meant to be called from a static GitHub Pages site. The MCP endpoint also has CORS for the same reason.
- **Rate limiting**: not currently enforced (the endpoints are protected by the cost of the underlying OpenAI/Groq calls and the synthetic-only data scope). For production, `slowapi` is in requirements but not wired in.

---

## Glossary

| Term | Meaning |
|---|---|
| **MCP** | Model Context Protocol. The protocol the ChronoCare server speaks to expose tools to agents. |
| **A2A** | Agent-to-agent. Prompt Opinion's mechanism for one agent (General Chat) to hand off a task to another (ChronoCore). |
| **FHIR** | Fast Healthcare Interoperability Resources. R4 is the version we use. |
| **HAPI** | Reference open-source Java FHIR server. Their public sandbox is what we use for demo data. |
| **LOINC, ICD-10, RxNorm** | Clinical code systems for labs, conditions, and drugs respectively. We have lookup tables for all three. |
| **eGFR, UACR, BNP, HbA1c** | Common labs used in the demo cases. Estimated GFR, urine albumin/creatinine ratio, B-type natriuretic peptide, glycated hemoglobin. |
| **Streamable HTTP** | The transport variant of MCP that Prompt Opinion supports. Uses POST + SSE responses. |
| **SHARP** | Smart Healthcare Application Profiles. Prompt Opinion's spec for FHIR Context extension on agents. |
| **Brief schema v1.0** | The shape of the unified clinical brief returned by `generate_unified_brief`. Documented in `docs/api/brief_schema.md`. |

---

## What was built (compressed timeline)

The work happened across one intensive build session. In rough order:

1. Backend MCP server with 14 tools, multi-model LLM routing, FHIR client, normalizer, in-memory cache, structured logging. 42 tests written.
2. Deployed to Railway. Verified `/health` and tool enumeration.
3. Switched FHIR backend from Prompt Opinion's workspace FHIR (couldn't generate OAuth client credentials in time) to HAPI public R4 sandbox.
4. Wrote a hand-curated demo patient bundle (John Doe, HTN → CKD), uploaded to HAPI.
5. Registered the MCP server in Prompt Opinion. Created the ChronoCore A2A agent. Verified end-to-end via General Chat, full 13-step pipeline executes in ~25 seconds, narrative cites specific dates.
6. Added 3 more demo patients (Maria, Robert, Sarah) covering different clinical archetypes. Built reproducible generator script.
7. Built React/Vite frontend with 4 pages: Landing, How it works, Demo, Admin. Hand-crafted clinical aesthetic with custom Tailwind theme + Framer Motion animations.
8. Added `POST /api/demo/analyze` endpoint so the frontend could drive the pipeline directly (in addition to the Prompt Opinion path).
9. Added admin dashboard + `POST /api/admin/patients` for live patient ingestion via the browser.
10. Wired voice (the 14th tool) with `POST /api/demo/voice` and a "Listen to brief" button.
11. Set up two CI/CD pipelines: Backend / Tests (pytest + smoke), Frontend / GitHub Pages (build + smoke).
12. Wrote runbooks, ADRs, and this reference document.

Final state: end-to-end working in production. All four patients analyzable. Voice playable. Admin can add more. Two surfaces (custom React UI + Prompt Opinion ChronoCore agent) both verified live.
