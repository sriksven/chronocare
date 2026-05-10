# Unified Clinical Brief Schema (v1.0)

The output of `generate_unified_brief` (Tool 13). This is what the A2A agent
formats into a human-readable response.

```json
{
  "patient_summary": {
    "id": "string",
    "name": "string",
    "birth_date": "YYYY-MM-DD",
    "gender": "male|female|other|unknown"
  },

  "clinical_narrative": "string (200-300 words)",

  "turning_points": [
    {
      "date": "YYYY-MM-DD",
      "event": "string",
      "significance": "string"
    }
  ],

  "early_warning": {
    "risk_level": "low|medium|high|unknown",
    "key_signals": ["string"],
    "trend_direction": "stable|worsening|improving|unknown",
    "time_sensitivity": "routine|urgent|emergent",
    "recommended_monitoring": "string",
    "summary": "string"
  },

  "causal_hypothesis": "string (150 words)",

  "comorbidity_map": [
    {
      "condition_a": "string",
      "condition_b": "string",
      "interaction": "string",
      "clinical_significance": "low|medium|high"
    }
  ],

  "guideline_matches": [
    {
      "guideline": "string (e.g. KDIGO 2022)",
      "recommendation": "string",
      "current_status": "met|gap|unknown",
      "note": "string"
    }
  ],

  "recommendations": [
    {
      "priority": 1,
      "action": "string",
      "rationale": "string",
      "specific_finding": "string",
      "urgency": "routine|urgent|emergent"
    }
  ],

  "generated_at": "ISO 8601 datetime",
  "schema_version": "1.0"
}
```

## Version History

| Version | Date | Changes |
|---|---|---|
| 1.0 | 2026-05-03 | Initial schema |
