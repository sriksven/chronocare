# ChronoCare

> "Understanding the past to prevent the future"

ChronoCare is a dual-layer clinical intelligence engine that reconstructs a patient's full medical story and detects silent deterioration before alarms go off. Built for a hackathon.

**Live deployment:** https://attractive-ambition-production-5fd7.up.railway.app/mcp/

---

## What It Does

A clinician types one prompt. ChronoCare chains 13 MCP tools and 8 LLM reasoning calls to answer four questions no EHR answers today:

| Question | Module |
|---|---|
| What happened to this patient over time? | Time Traveler |
| What is quietly going wrong right now? | Silent Deterioration Detector |
| Why did this happen? | Root Cause Analyzer |
| What should we do next? | Recommendation Engine |

Output: a unified clinical brief, narrative story, early warning signals, causal hypotheses, and evidence-grounded next steps, in under 35 seconds end-to-end (verified).

---

## Demo

Three ways to see the system run:

1. **Custom UI**, https://sriksven.github.io/chronocare/ (React + Vite, deployed on GitHub Pages). The `/demo` page calls the live MCP server and renders the unified clinical brief with a 4-patient picker.
2. **Prompt Opinion Marketplace**, both the **ChronoCare MCP** server and the **ChronoCore** A2A agent are published and installable. Add the agent to any workspace, paste `I need a full clinical analysis of demo patient d0be5a00-57c5-4417-adeb-824beb93e4c3`, and ChronoCore chains all 13 tools.
3. **Direct CLI**, `curl -X POST .../api/demo/analyze -d '{"patient_id":"…"}'` returns the full unified brief JSON.

**Demo patients on HAPI public R4:**

| Patient | ID | Clinical archetype |
|---|---|---|
| John Doe (62, M) | `d0be5a00-57c5-4417-adeb-824beb93e4c3` | HTN → CKD silent multi-year cascade |
| Maria Rodriguez (58, F) | `a8c2f1d5-3e6b-4a91-9c4f-2d8e7b0a5f3c` | T2DM poor control → early nephropathy |
| Robert Chen (71, M) | `b3e7d2a8-9f4c-4b1e-8a6d-c5f2b9e0a4d7` | CHF + AFib + COPD → cardiorenal syndrome |
| Sarah Williams (45, F) | `f4a9c1e6-7b3d-4f82-8e5a-1d6c3f0b9a7e` | Prediabetes + borderline HTN (control case) |

**Admin dashboard:** https://sriksven.github.io/chronocare/#/admin (requires the `ADMIN_KEY` env var set on Railway). Lets you upload new FHIR bundles via the browser.

---

## Quick Start (Local)

### Prerequisites

- Python 3.11+
- Docker + Docker Compose
- An OpenAI API key
- A Groq API key (free tier at console.groq.com)

### Run locally

```bash
git clone <repo-url>
cd chronocare

cp .env.example .env
# Fill in OPENAI_API_KEY, GROQ_API_KEY, MCP_API_KEY, FHIR_BASE_URL

# Option A, Docker
docker compose up --build

# Option B, Python directly
pip install -r requirements.txt
python -m chronocare.server
```

Server starts at `http://localhost:8000`. Health check: `GET /health`.

### Run tests

```bash
pytest tests/ -v
```

42 tests across unit + integration; all green.

---

## Architecture

```
PROMPT OPINION (UI + A2A platform)
        │
        │ General Chat → ChronoCore agent → MCP tool calls
        ▼
ChronoCare MCP Server (Railway)
  ├── FHIR data layer  ──► HAPI public R4 (demo) or any FHIR R4 server
  ├── Reasoning layer  ──► OpenAI GPT-4o + Groq Llama-3.3-70b + GPT-4o-mini
  └── Voice layer      ──► OpenAI TTS (primary), Google Cloud TTS (fallback)
```

**Multi-model routing** (see [ADR-002](docs/adr/002-claude-haiku.md)):
- 4 calls → Groq Llama-3.3-70b (fast structured JSON: turning points, early warning, correlations, comorbidities)
- 4 calls → OpenAI GPT-4o / GPT-4o-mini (narrative, weak patterns, causal hypothesis, recommendations)

---

## Project Structure

```
chronocare/
├── src/chronocare/
│   ├── server.py            # MCP server entry point, 14 tools registered
│   ├── tools/               # 13 reasoning + synthesis tools
│   │   ├── time_traveler.py
│   │   ├── deterioration.py
│   │   ├── root_cause.py
│   │   ├── recommendations.py
│   │   └── synthesis.py
│   ├── reasoning/
│   │   ├── llm_client.py    # Multi-model routing (OpenAI + Groq)
│   │   └── prompts.py       # All prompt templates
│   ├── fhir/                # FHIR R4 client + normalizer + cache
│   ├── voice/tts.py         # 14th tool, OpenAI / Google TTS
│   └── utils/               # Config + structured logging
├── tests/                   # Unit + integration (42 tests, all green)
├── data/code_mappings/      # LOINC, ICD-10, RxNorm lookups
├── scripts/
│   ├── upload_fhir_bundle.py    # POST a bundle to a FHIR R4 server
│   └── test_mcp_connection.py   # Smoke test the live deploy
├── docs/                    # Architecture, ADRs, runbooks, API reference
├── Dockerfile, docker-compose.yml, requirements.txt, .env.example
└── .github/workflows/deploy.yml  # CI tests + Railway deploy on push to main
```

---

## Deployment

Live on [Railway](https://railway.app):
- URL: `https://attractive-ambition-production-5fd7.up.railway.app`
- MCP endpoint: `/mcp/` (note trailing slash, Streamable HTTP requirement)
- Health: `GET /health` → `{"status": "ok", "tools_count": 14, "llm_backend": "gpt-4o+groq-llama3.3"}`
- Auth: `X-ChronoCare-Key: <MCP_API_KEY>` header

Manual redeploy:
```bash
railway up --detach
railway variables --set "FHIR_BASE_URL=https://hapi.fhir.org/baseR4"
```

CI: push to `main` runs `pytest`, then auto-deploys via `.github/workflows/deploy.yml`.

See [docs/runbooks/deployment.md](docs/runbooks/deployment.md) for the full procedure.

---

## Hackathon

- **Submission path:** A2A Agent (ChronoCore) powered by a custom MCP Server (this repo)
- **Platform:** Prompt Opinion
- **Team:** Krishna Venkatesh
