# ADR-002: Multi-model routing — GPT-4o + Groq Llama-3.3-70b

**Date:** 2026-05-03 (revised from original Claude Haiku decision)  
**Status:** Accepted

## Context

ChronoCare makes 8 LLM calls per full pipeline. The original decision was Claude Haiku for all calls. After review, we split calls across two providers based on what each step actually needs.

## Decision

Route calls by task type:

| Step | Backend | Model | Reason |
|---|---|---|---|
| Turning points | Groq | llama-3.3-70b-versatile | Fast structured JSON, low latency |
| Patient narrative | OpenAI | gpt-4o | Best prose quality for clinical handoff |
| Weak pattern analysis | OpenAI | gpt-4o | Deepest reasoning across multi-signal inputs |
| Early warning report | Groq | llama-3.3-70b-versatile | Fast structured JSON |
| Event correlation | Groq | llama-3.3-70b-versatile | Fast structured JSON |
| Causal hypothesis | OpenAI | gpt-4o | Nuanced causal narrative |
| Comorbidity map | Groq | llama-3.3-70b-versatile | Fast structured JSON |
| Guideline matching | OpenAI | gpt-4o-mini | Sufficient for rule-lookup; cheaper |
| Recommendations | OpenAI | gpt-4o | Most critical output — needs best reasoning |

## Rationale

**Why split at all?**  
Four of the eight calls produce structured JSON where the main requirement is reliable JSON output and speed — not narrative quality. Groq Llama-3.3-70b is faster and cheaper for these steps. The other four calls either need deep reasoning (weak patterns, recommendations) or high-quality prose (narrative, causal hypothesis) — those go to GPT-4o.

**Why GPT-4o-mini for guidelines?**  
Guideline matching is essentially a retrieval+lookup task: "does this condition appear in ADA guidelines?" GPT-4o-mini handles this well at lower cost.

**Why not keep a single provider?**  
Two providers also improves resilience: if OpenAI has an outage, Groq calls still succeed (4 of 8 steps). A full-pipeline failure only occurs if both are down simultaneously.

## Consequences

- Two API keys required (`OPENAI_API_KEY`, `GROQ_API_KEY`)
- `llm_client.py` holds both client instances; routing is by `backend=` parameter at each call site
- Prompts require no changes — both providers use the standard `{"role": "system"}` + `{"role": "user"}` message format
- Test mocks pass through the same `LLMClient` interface — no test changes needed
