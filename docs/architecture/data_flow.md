# Data Flow

## Full Pipeline (13 tools, 8 LLM calls)

```
INPUT: patient_id + fhir_token (from SHARP context)
                │
                ▼
[Tool 1] get_full_patient_history
  • Parallel FHIR calls: Patient, Condition, Observation,
    MedicationRequest, Encounter, DocumentReference
  • Normalize: LOINC → lab names, ICD-10 → condition names
  • Cache result (TTL: 5 min)
  Output: {patient: {...}, events: [...]}
                │
                ▼
[Tool 2] order_events_chronologically
  • Pure Python sort + dedup
  • Events sorted by date ascending
  Output: flat list of events
                │
                ▼
[Tool 3] identify_clinical_turning_points        ← LLM Call 1
  • Temperature 0.2
  • Input: timeline (capped at 100 events)
  • Output: [{date, event, significance}] × 3-5
                │
                ▼
[Tool 4] generate_patient_narrative              ← LLM Call 2
  • Temperature 0.5 (narrative prose)
  • Input: timeline + turning points
  • Output: 200-300 word clinical narrative
                │
        ┌───────┴──────────────────────┐
        ▼                              ▼
[Tool 5] get_recent_signals      Historical path
  • Filter: last 90 days              │
  • Pure Python                  (used for root cause)
        │                              │
        ▼                              ▼
[Tool 6] analyze_weak_patterns   [Tool 8] correlate_events  ← LLM Call 5
         ← LLM Call 3             • Causal pairs with
  • Holistic multi-signal           confidence levels
    reasoning
        │                              │
        ▼                              ▼
[Tool 7] generate_early_warning  [Tool 9] generate_causal_hypothesis
         ← LLM Call 4                     ← LLM Call 6
  • Structured risk report        • 150-word causal narrative
        │                              │
        └───────────────┬──────────────┘
                        │
                        ▼
[Tool 10] map_comorbidities                      ← LLM Call 7a
  • Condition interaction map

[Tool 11] match_clinical_guidelines              ← LLM Call 7b
  • ADA / JNC / KDIGO / ACC-AHA gap analysis

[Tool 12] generate_recommendations               ← LLM Call 8
  • 3-5 patient-specific actions with citations
                        │
                        ▼
[Tool 13] generate_unified_brief
  • Pure JSON assembly — no LLM
  • All prior outputs → structured brief
OUTPUT: {patient_summary, clinical_narrative, turning_points,
         early_warning, causal_hypothesis, comorbidity_map,
         guideline_matches, recommendations, generated_at}
```

## Caching Layer

```
FHIR request (patient_id)
        │
        ▼
Cache hit? ──yes──▶ Return cached normalized history
        │
       no
        │
        ▼
FHIR API call → Normalize → Cache(TTL=300s) → Return
```

## LLM Context Management

Each LLM call receives only what it needs — no full conversation history.

| Call | Input context | Token budget |
|---|---|---|
| Turning points | Timeline (≤100 events) | 500 out |
| Narrative | Timeline + turning points | 600 out |
| Weak patterns | Recent signals (≤90 days) | 700 out |
| Early warning | Pattern analysis dict | 400 out |
| Correlations | Timeline (≤100 events) | 700 out |
| Causal hypothesis | Top 10 correlations | 400 out |
| Comorbidities | Active conditions | 500 out |
| Guidelines | Conditions + meds + signals | 700 out |
| Recommendations | Hypothesis + guidelines + warning | 700 out |
