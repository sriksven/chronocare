# 9-Day Sprint Plan

Deadline: May 11, 2026

## Status

| Day | Focus | Status | Notes |
|---|---|---|---|
| Day 1 | Setup: Prompt Opinion account, Synthea, upload FHIR bundle | Pending | |
| Day 2 | MCP scaffold: Docker, Railway, health endpoint, Tool 1 | Done | Repo structure + all 14 tools scaffolded |
| Day 3 | Time Traveler: Tools 2-4, LLM calls working | Pending | |
| Day 4 | Deterioration: Tools 5-7 | Pending | |
| Day 5 | Root Cause + Recs: Tools 8-12 | Pending | |
| Day 6 | Integration: Tool 13, full pipeline e2e, Railway deploy | Pending | |
| Day 7 | Agent + Voice: A2A agent configured, voice tool | Pending | |
| Day 8 | Polish: edge cases, rate limiting, marketplace publish | Pending | |
| Day 9 | Submit: 3-min video, Devpost description | Pending | |

## Day 1 Checklist

- [ ] Create Prompt Opinion account at promptopinion.com
- [ ] Download and install Synthea (requires Java 11+)
- [ ] Run Synthea to generate FHIR bundle for target patient profile
- [ ] Upload bundle to Prompt Opinion FHIR server
- [ ] Note the patient_id assigned by the platform
- [ ] Verify patient data visible in platform launchpad

## Day 2 Checklist (completed in repo scaffold)

- [x] Python project structure (`src/chronocare/`)
- [x] All 14 MCP tools stubbed and registered in server.py
- [x] Docker + docker-compose setup
- [x] Railway project config
- [x] Health endpoint (`GET /health`)
- [x] Environment variable validation
- [x] Unit + integration tests scaffold
- [ ] Railway project created (need account)
- [ ] Deploy and verify health endpoint live

## Day 3-5 — Implementation Notes

The code scaffold in `src/` is complete. Each tool implementation is in:
- Tools 1-4: `src/chronocare/tools/time_traveler.py`
- Tools 5-7: `src/chronocare/tools/deterioration.py`
- Tools 8-9: `src/chronocare/tools/root_cause.py`
- Tools 10-12: `src/chronocare/tools/recommendations.py`
- Tool 13: `src/chronocare/tools/synthesis.py`

LLM prompts are in `src/chronocare/reasoning/prompts.py`. Each can be tuned
independently without changing tool logic.

## Day 7 — A2A Agent System Prompt (copy-paste into Prompt Opinion)

```
You are ChronoCore, an advanced clinical intelligence agent. You have access
to a set of specialized MCP tools that allow you to deeply analyze a patient's
full medical history.

Demo patient ID: d0be5a00-57c5-4417-adeb-824beb93e4c3
If the patient context is not automatically provided, use this ID.

When asked to analyze a patient, you will:
1. Use get_full_patient_history to retrieve all available data
2. Use order_events_chronologically to build the timeline
3. Use identify_clinical_turning_points to find key moments
4. Use generate_patient_narrative to tell the patient's story
5. Use get_recent_signals to examine recent data (lookback_days: 90)
6. Use analyze_weak_patterns to detect subtle deterioration signals
7. Use generate_early_warning_report to formalize the risk assessment
8. Use correlate_events and generate_causal_hypothesis for root cause
9. Use map_comorbidities and match_clinical_guidelines for context
10. Use generate_recommendations for actionable next steps
11. Use generate_unified_brief to synthesize everything

Always reason step by step. Cite specific dates and values from the patient
data. Never make generic recommendations — every output must reference this
specific patient's findings. Maintain clinical precision and appropriate
uncertainty language ("suggests", "warrants investigation", "consider").
```

## Judging Simulation Test (Day 8)

Run this exact scenario before submitting:

1. Open Prompt Opinion launchpad
2. Select demo patient (John Doe, 62, HTN + CKD)
3. Select General Chat agent
4. Type: "I need a full clinical analysis of this patient"
5. Confirm General Chat routes to ChronoCore via A2A
6. Time the response — must be < 30 seconds
7. Verify: narrative mentions 3+ years of history
8. Verify: warning section references specific lab values (Creatinine 1.3, BP 138/88)
9. Verify: recommendations cite specific findings (not generic advice)
10. Verify: no hallucinated data points
