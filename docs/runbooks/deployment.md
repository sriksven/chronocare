# Deployment Runbook

**Live URL:** `https://attractive-ambition-production-5fd7.up.railway.app`
**MCP endpoint:** `/mcp/` (trailing slash required by Streamable HTTP)

---

## Normal Deployment (via CI/CD)

1. Push to `main` branch
2. GitHub Actions runs `pytest tests/ -v`
3. If tests pass → Railway auto-deploys via the `RAILWAY_TOKEN` GitHub secret
4. Verify: `curl https://attractive-ambition-production-5fd7.up.railway.app/health` → 200 OK

## Manual Deployment (Railway CLI)

```bash
npm install -g @railway/cli
railway login
railway up --detach
```

## Environment Variables (Railway dashboard)

Set in Railway → Project → Service → Variables:

| Variable | Required | Value |
|---|---|---|
| `OPENAI_API_KEY` | yes | OpenAI key (used for GPT-4o, GPT-4o-mini, and TTS) |
| `GROQ_API_KEY` | yes | Groq key (Llama-3.3-70b for fast structured calls) |
| `MCP_API_KEY` | yes | Random 32-char string, set as auth header in Prompt Opinion |
| `FHIR_BASE_URL` | yes | `https://hapi.fhir.org/baseR4` for the demo patient |
| `FHIR_TOKEN` | no | Bearer token if your FHIR server requires auth (HAPI public does not) |
| `GOOGLE_TTS_API_KEY` | no | Optional fallback TTS, primary backend uses `OPENAI_API_KEY` |
| `ADMIN_KEY` | no | Enables `POST /api/admin/patients` (and the `/admin` page in the frontend). Generate via `openssl rand -hex 16`. If unset, the admin endpoint returns 503. |
| `LOG_LEVEL` | no | Defaults to `INFO` |
| `CACHE_TTL_SECONDS` | no | Defaults to `300` |

Set them via CLI:
```bash
railway variables \
  --set "OPENAI_API_KEY=sk-..." \
  --set "GROQ_API_KEY=gsk_..." \
  --set "MCP_API_KEY=..." \
  --set "FHIR_BASE_URL=https://hapi.fhir.org/baseR4"
```

## Connecting to Prompt Opinion

1. In Prompt Opinion: Configuration → MCP Servers → My MCP Servers → **+ Add MCP Server**
2. Friendly Name: `ChronoCare MCP`
3. Endpoint: `https://attractive-ambition-production-5fd7.up.railway.app/mcp/`
4. Transport Type: **Streamable HTTP**
5. Authentication Type: **API Key**
6. API Key Header Name: `X-ChronoCare-Key`
7. API Key Header Value: your `MCP_API_KEY`
8. Click **Reconnect**, all 14 tools should appear; "PromptOpinion FHIR Context Supported" badge should show.

**FHIR Context Extension toggle:** leave OFF for the HAPI demo (otherwise PO injects its own workspace FHIR URL/token, overriding `FHIR_BASE_URL`). Turn ON only when pointing at a real Prompt Opinion FHIR workspace with valid OAuth credentials.

## Smoke Test the Deploy

```bash
python scripts/test_mcp_connection.py \
  --url https://attractive-ambition-production-5fd7.up.railway.app \
  --key "$MCP_API_KEY"
```

Expected output: `All tools present. MCP server OK.`

## Railway Free Tier Limits

- 500 MB RAM, 2 vCPU
- 5 GB egress/month
- Container sleeps after ~15 min of inactivity (cold start ~5-10s)

**Demo tip:** `curl /health` 30 seconds before a demo to warm the container.

## Rollback

Railway dashboard → Deployments → previous deploy → Rollback.
