# MCP Tool Reference

All 14 tools exposed by the ChronoCare MCP server.

**Base URL:** `https://attractive-ambition-production-5fd7.up.railway.app/mcp/`
**Transport:** Streamable HTTP (note trailing slash on `/mcp/`)
**Auth:** `X-ChronoCare-Key: <MCP_API_KEY>` header
**Accept:** `application/json, text/event-stream` (SSE responses)

---

## Time Traveler Tools

### `get_full_patient_history`

Fetch and normalize all FHIR resources for a patient.

**Input:**
```json
{
  "patient_id": "demo-patient-001",
  "fhir_base_url": "https://fhir.example.com",
  "fhir_token": "Bearer eyJ..."
}
```

**Output:**
```json
{
  "patient": {"id": "...", "name": "John Doe", "birth_date": "1963-04-15", "gender": "male"},
  "events": [
    {"event_type": "condition", "date": "2019-03-12", "description": "Hypertension", "code": "I10", "status": "active"},
    {"event_type": "observation", "date": "2026-02-14", "description": "Creatinine", "value": 1.3, "unit": "mg/dL"}
  ]
}
```

**Notes:** Results cached for `CACHE_TTL_SECONDS` (default 300s).

---

### `order_events_chronologically`

Sort and deduplicate patient events.

**Input:** `{"history": <output from get_full_patient_history>}`  
**Output:** Flat sorted list of event dicts.  
**LLM:** No.

---

### `identify_clinical_turning_points`

Find 3-5 key moments that changed clinical trajectory.

**Input:** `{"timeline": [...]}`  
**Output:**
```json
[
  {"date": "2019-03-12", "event": "Hypertension diagnosed", "significance": "Starting point of cardiometabolic cascade."},
  {"date": "2022-11-08", "event": "CKD Stage 2 diagnosed", "significance": "..."}
]
```
**LLM:** Yes (Call 1). Temperature 0.2.

---

### `generate_patient_narrative`

200-300 word clinical narrative.

**Input:** `{"timeline": [...], "turning_points": [...]}`  
**Output:** Plain text narrative string.  
**LLM:** Yes (Call 2). Temperature 0.5.

---

## Silent Deterioration Tools

### `get_recent_signals`

Filter timeline to past N days.

**Input:** `{"timeline": [...], "lookback_days": 90}`  
**Output:** Filtered event list.  
**LLM:** No.

---

### `analyze_weak_patterns`

Holistic multi-signal analysis — the core AI step.

**Input:** `{"recent_signals": [...]}`  
**Output:**
```json
{
  "risk_level": "medium",
  "signal_clusters": [{"signals": [...], "pattern": "...", "concern": "..."}],
  "overall_assessment": "...",
  "individually_normal_but_together": true
}
```
**LLM:** Yes (Call 3). Temperature 0.2.

---

### `generate_early_warning_report`

Structured early warning report.

**Input:** `{"pattern_analysis": <output from analyze_weak_patterns>}`  
**Output:**
```json
{
  "risk_level": "medium",
  "key_signals": ["BP 138/88", "Creatinine 1.3"],
  "trend_direction": "worsening",
  "time_sensitivity": "urgent",
  "recommended_monitoring": "Repeat BMP in 2 weeks",
  "summary": "..."
}
```
**LLM:** Yes (Call 4). Temperature 0.2.

---

## Root Cause Tools

### `correlate_events`

Identify causal pairs between clinical events.

**Input:** `{"timeline": [...]}`  
**Output:**
```json
[
  {"cause_event": "BP uncontrolled", "cause_date": "2021-05-01",
   "effect_event": "CKD diagnosed", "effect_date": "2022-11-08",
   "confidence": "high", "rationale": "Sustained hypertension causes glomerulosclerosis."}
]
```
**LLM:** Yes (Call 5). Temperature 0.2.

---

### `generate_causal_hypothesis`

150-word narrative from correlations.

**Input:** `{"correlations": [...]}`  
**Output:** Plain text hypothesis.  
**LLM:** Yes (Call 6). Temperature 0.5.

---

## Recommendation Tools

### `map_comorbidities`

Map interactions between active conditions.

**Input:** `{"events": [...]}`  
**Output:**
```json
[{"condition_a": "Hypertension", "condition_b": "CKD", "interaction": "HTN accelerates CKD progression", "clinical_significance": "high"}]
```
**LLM:** Yes (Call 7a). Temperature 0.2.

---

### `match_clinical_guidelines`

Gap analysis vs. ADA, JNC, KDIGO, ACC/AHA.

**Input:** `{"events": [...], "recent_signals": [...]}`  
**Output:**
```json
[{"guideline": "KDIGO 2022", "recommendation": "Nephrology referral at eGFR <60", "current_status": "gap", "note": "No referral in chart"}]
```
**LLM:** Yes (Call 7b). Temperature 0.2.

---

### `generate_recommendations`

3-5 patient-specific clinical actions.

**Input:**
```json
{
  "causal_hypothesis": "...",
  "guideline_matches": [...],
  "early_warning": {...}
}
```
**Output:**
```json
[
  {"priority": 1, "action": "Nephrology referral", "rationale": "Creatinine 1.3 with rising trend",
   "specific_finding": "Creatinine increased from 1.1 to 1.3 mg/dL over 3 months", "urgency": "urgent"}
]
```
**LLM:** Yes (Call 8). Temperature 0.2.

---

## Synthesis Tool

### `generate_unified_brief`

Assemble all outputs into final structured brief. No LLM.

**Input:** All prior tool outputs (see server.py inputSchema).  
**Output:** Full clinical brief JSON (see `docs/api/brief_schema.md`).

---

## Voice Tool

### `text_to_speech_brief`

Convert brief sections to audio.

**Input:** `{"brief": {...}, "sections": ["narrative", "early_warning", "recommendations"]}`  
**Output:**
```json
{
  "supported": true,
  "transcript": "Clinical brief for John Doe...",
  "audio_bytes": "<base64 MP3>"
}
```

Backend selection: tries OpenAI TTS first (`OPENAI_API_KEY`, model `tts-1`, voice `alloy`), then Google Cloud TTS (`GOOGLE_TTS_API_KEY`) as fallback. The response includes a `backend` field (`"openai"` or `"google"`) indicating which one was used. If neither key is set, returns `supported: false` with the transcript only.
