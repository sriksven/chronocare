# Debugging Runbook

**Live URL:** `https://attractive-ambition-production-5fd7.up.railway.app`
**Tail logs:** `railway logs --deployment`

---

## Common Issues

### `EnvironmentError: Missing required environment variables`

Required vars (set on Railway and locally in `.env`):
- `OPENAI_API_KEY`
- `GROQ_API_KEY`
- `MCP_API_KEY`
- `FHIR_BASE_URL`

Locally: `cp .env.example .env` and fill in values.

---

### `Illegal header value b'Bearer '` (FHIR call fails)

Means `FHIR_TOKEN` is unset or empty AND something is still trying to send an Authorization header. Already fixed in [src/chronocare/fhir/client.py](../../src/chronocare/fhir/client.py) — only adds the header when token is non-empty. If you see this error on a fresh deploy, redeploy (`railway up --detach`).

---

### FHIR calls return 401

Token expired or wrong. For HAPI public R4 there is no auth — `FHIR_TOKEN` should be unset/empty. For Prompt Opinion FHIR workspaces, refresh the OAuth token via `POST /openid/connect/token` (grant: client_credentials, scope: po_fhir).

---

### FHIR calls return 404 for patient

Patient not present at the FHIR endpoint. Re-upload the demo bundle:

```bash
# To HAPI public R4 (default demo target):
python3 -c "
import json, httpx
b = json.load(open('tests/fixtures/demo_patient_fhir.json'))
for e in b['entry']:
    if e['resource'].get('id'):
        e['request'] = {'method':'PUT','url':f\"{e['resource']['resourceType']}/{e['resource']['id']}\"}
print(httpx.post('https://hapi.fhir.org/baseR4/', json=b, timeout=120,
                 headers={'Content-Type':'application/fhir+json'}).status_code)
"

# Demo patient ID after upload: d0be5a00-57c5-4417-adeb-824beb93e4c3
```

The bundle uses PUT-with-id so HAPI preserves the demo patient ID.

---

### LLM returns non-JSON (ValueError in llm_client.py)

The model gave a response outside the expected JSON schema, usually on edge-case data.

**Fix:** Check `railway logs --deployment` for the raw LLM response. Tighten the relevant prompt in [src/chronocare/reasoning/prompts.py](../../src/chronocare/reasoning/prompts.py). Re-test with `pytest tests/unit/`.

---

### Pipeline takes > 35 seconds

Verified baseline: ~25–35s end-to-end through the full 13-step pipeline.

If slower, check which tool is slow:
1. `railway logs --deployment | grep llm_call` — look for high `latency_ms`
2. Common culprits:
   - GPT-4o latency spike (OpenAI side) — typically 3–7s/call
   - Groq rate-limit retry — check for `llm_rate_limit` warnings
   - HAPI public sandbox slow at peak — workaround: spin up HAPI locally or move to a paid FHIR tier

---

### MCP tool not found on Prompt Opinion

Run the smoke test:
```bash
python scripts/test_mcp_connection.py \
  --url https://attractive-ambition-production-5fd7.up.railway.app \
  --key "$MCP_API_KEY"
```

Expected: `All tools present. MCP server OK.` If a tool is missing, check `server.py:list_tools()`.

---

### Cold start on Railway (first request slow)

```bash
curl https://attractive-ambition-production-5fd7.up.railway.app/health
```
Run 30 seconds before the demo. Container stays warm for ~15 min after activity.

---

### Agent (ChronoCore) only chains 1–2 tools instead of 13

Symptom: only 1–2 `Processing request of type CallToolRequest` log entries despite asking for "full clinical analysis."

**Root cause:** weaker model (`gpt-4.1-mini`) doesn't reliably chain 13 sequential tool calls.

**Fix:** In Prompt Opinion → Agents → ChronoCore → Edit → Basic tab → change Model from `openai/gpt-4.1-mini` to `openai/gpt-4.1` or `openai/gpt-4o`.

---

## Log Structure

All logs are JSON via `structlog`. Railway streams them to the Logs tab.

**Per-LLM-call log entry:**
```json
{"event": "llm_call", "model": "gpt-4o", "input_tokens": 3653,
 "output_tokens": 600, "latency_ms": 7259, "logger": "chronocare.reasoning.llm_client"}
```

**FHIR context per request (server-side):**
```
FHIR_CONTEXT fhir_url=https://hapi.fhir.org/baseR4 patient_id=<hash>
```

Patient IDs are hashed to a SHA-256 prefix before logging — real IDs never appear.
