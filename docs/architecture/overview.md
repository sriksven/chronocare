# Architecture Overview

## System Layers

```
┌─────────────────────────────────────────────────────────────────┐
│                    PROMPT OPINION PLATFORM                       │
│                                                                  │
│   ┌──────────────────────────────────────────────────────────┐  │
│   │                 ChronoCore A2A AGENT                     │  │
│   │  System prompt → multi-step tool orchestration           │  │
│   │  Skills: full_patient_analysis, quick_deterioration      │  │
│   └──────────────┬───────────────────────────────────────────┘  │
│                  │ A2A calls                                     │
│                  ▼                                               │
│   ┌──────────────────────────────────────────────────────────┐  │
│   │              FHIR Context (SHARP Extension)              │  │
│   │     patient_id + fhir_token passed automatically         │  │
│   └──────────────┬───────────────────────────────────────────┘  │
└──────────────────┼──────────────────────────────────────────────┘
                   │ MCP calls (Streamable HTTP)
                   ▼
┌─────────────────────────────────────────────────────────────────┐
│              ChronoCare MCP SERVER (Railway)                     │
│                                                                  │
│  src/chronocare/server.py — 14 tools                            │
│  src/chronocare/tools/     — tool implementations               │
│  src/chronocare/fhir/      — FHIR client + normalizer + cache   │
│  src/chronocare/reasoning/ — LLM client + prompts               │
│  src/chronocare/voice/     — TTS layer                          │
└──────────────┬──────────────────────────────────────────────────┘
               │ FHIR REST API calls
               ▼
┌─────────────────────────────────────────────────────────────────┐
│         FHIR R4 SERVER (any conformant endpoint)                │
│   Demo target: HAPI public R4 — https://hapi.fhir.org/baseR4    │
│   Resources: Patient | Condition | Observation | MedicationReq  │
│              Encounter | DiagnosticReport | DocumentReference   │
└─────────────────────────────────────────────────────────────────┘
               ▲
               │ Uploaded via tests/fixtures/demo_patient_fhir.json (PUT bundle)
┌─────────────────────────────────────────────────────────────────┐
│               SYNTHETIC DATA                                    │
│   FHIR R4 bundle, fully synthetic — no PHI                      │
│   John Doe, 62yo male, HTN (2019) + T2DM + CKD progression      │
│   Patient ID: d0be5a00-57c5-4417-adeb-824beb93e4c3              │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│   LLM Layer — multi-provider routing                            │
│   • OpenAI gpt-4o          — narrative, weak patterns,          │
│                              causal hypothesis, recommendations │
│   • OpenAI gpt-4o-mini     — guideline matching                 │
│   • Groq llama-3.3-70b     — turning points, early warning,     │
│                              correlations, comorbidities        │
│   8 LLM calls per pipeline, ~25–35s end-to-end                  │
└─────────────────────────────────────────────────────────────────┘
```

## Key Design Decisions

See [ADRs](../adr/) for the full rationale behind each decision.

### Why Python for the MCP server?
Best ecosystem for the OpenAI/Groq SDKs, FHIR libraries, and `structlog`. See [ADR-001](../adr/001-python-mcp-server.md).

### Why split LLM calls across OpenAI and Groq?
Four calls produce structured JSON where speed beats prose quality — Groq Llama-3.3-70b handles those. Four calls need deep reasoning or quality prose — those go to GPT-4o / GPT-4o-mini. Two providers also gives partial-failure resilience. Full rationale in [ADR-002](../adr/002-claude-haiku.md).

### Why in-memory cache?
Demo environment is stateless and single-instance. No need for Redis overhead. See [ADR-003](../adr/003-in-memory-cache.md).

### Why Streamable HTTP transport?
Required by Prompt Opinion's MCP integration. SSE/stdio not supported on their platform.

## Security Boundaries

- FHIR token is passed per-request from the A2A agent (not stored server-side)
- MCP API key authenticates inbound calls from the platform
- Patient IDs are hashed before appearing in logs
- No PHI is logged (only hashed IDs + counts)
- All FHIR data is synthetic (Synthea)
