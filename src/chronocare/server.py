"""ChronoCare MCP Server entry point.

Exposes 15 MCP tools over Streamable HTTP. Authentication via
X-ChronoCare-Key header (validated against MCP_API_KEY env var).

Run locally:
    python -m chronocare.server

Production (Docker):
    CMD ["python", "-m", "chronocare.server"]
"""

from __future__ import annotations

import contextvars
import json
import os
from typing import Any

import httpx
from mcp.server import Server
from mcp.server.streamable_http_manager import StreamableHTTPSessionManager
from mcp.types import Tool, TextContent

# Holds FHIR credentials injected by Prompt Opinion per-request
_fhir_ctx: contextvars.ContextVar[dict[str, str]] = contextvars.ContextVar(
    "fhir_ctx", default={}
)

_FHIR_EXTENSION = {
    "scopes": [
        {"name": "patient/Patient.rs", "required": True},
        {"name": "patient/Condition.rs", "required": True},
        {"name": "patient/Observation.rs", "required": True},
        {"name": "patient/MedicationRequest.rs", "required": True},
        {"name": "patient/Encounter.rs", "required": True},
        {"name": "patient/DiagnosticReport.rs", "required": True},
        {"name": "patient/DocumentReference.rs"},
    ]
}

from chronocare.fhir.cache import TTLCache
from chronocare.reasoning.llm_client import LLMClient
from chronocare.tools import (
    deterioration,
    recommendations,
    root_cause,
    synthesis,
    time_traveler,
)
from chronocare.utils.config import load_config
from chronocare.utils.logging import setup_logging
from chronocare.voice.tts import text_to_speech_brief

config = load_config()
setup_logging(config.log_level)

_cache = TTLCache(ttl_seconds=config.cache_ttl_seconds)
_llm = LLMClient(openai_api_key=config.openai_api_key, groq_api_key=config.groq_api_key)

app = Server("chronocare-mcp")

# Inject Prompt Opinion FHIR extension into the initialize response
_orig_create_init = app.create_initialization_options
def _create_init_with_fhir(notification_options=None, experimental_capabilities=None):
    opts = _orig_create_init(notification_options, experimental_capabilities or {})
    opts.capabilities.__pydantic_extra__["extensions"] = {
        "ai.promptopinion/fhir-context": _FHIR_EXTENSION
    }
    return opts
app.create_initialization_options = _create_init_with_fhir


# ---------------------------------------------------------------------------
# Tool registration
# ---------------------------------------------------------------------------

@app.list_tools()
async def list_tools() -> list[Tool]:
    return [
        Tool(
            name="get_full_patient_history",
            description=(
                "Fetch and normalize all FHIR resources for a patient. "
                "Returns structured history with conditions, medications, labs, encounters, and notes."
            ),
            inputSchema={
                "type": "object",
                "properties": {
                    "patient_id": {"type": "string"},
                    "fhir_base_url": {"type": "string"},
                    "fhir_token": {"type": "string"},
                },
                "required": ["patient_id"],
            },
        ),
        Tool(
            name="order_events_chronologically",
            description="Sort and deduplicate patient events into a chronological timeline.",
            inputSchema={
                "type": "object",
                "properties": {"history": {"type": "object"}},
                "required": ["history"],
            },
        ),
        Tool(
            name="identify_clinical_turning_points",
            description="Identify 3-5 key moments that changed the patient's clinical trajectory (LLM-powered).",
            inputSchema={
                "type": "object",
                "properties": {"timeline": {"type": "array", "items": {"type": "object"}}},
                "required": ["timeline"],
            },
        ),
        Tool(
            name="generate_patient_narrative",
            description="Generate a 200-300 word clinical narrative from timeline and turning points (LLM-powered).",
            inputSchema={
                "type": "object",
                "properties": {
                    "timeline": {"type": "array", "items": {"type": "object"}},
                    "turning_points": {"type": "array", "items": {"type": "object"}},
                },
                "required": ["timeline", "turning_points"],
            },
        ),
        Tool(
            name="get_recent_signals",
            description="Filter patient timeline to events within the past N days (default 90).",
            inputSchema={
                "type": "object",
                "properties": {
                    "timeline": {"type": "array", "items": {"type": "object"}},
                    "lookback_days": {"type": "integer", "default": 90},
                },
                "required": ["timeline"],
            },
        ),
        Tool(
            name="analyze_weak_patterns",
            description=(
                "Holistic multi-signal pattern analysis for silent deterioration. "
                "Reasons across all signals together — not individual thresholds (LLM-powered)."
            ),
            inputSchema={
                "type": "object",
                "properties": {"recent_signals": {"type": "array", "items": {"type": "object"}}},
                "required": ["recent_signals"],
            },
        ),
        Tool(
            name="generate_early_warning_report",
            description="Format pattern analysis into a structured early warning report (LLM-powered).",
            inputSchema={
                "type": "object",
                "properties": {"pattern_analysis": {"type": "object"}},
                "required": ["pattern_analysis"],
            },
        ),
        Tool(
            name="correlate_events",
            description="Identify plausible causal relationships between clinical events (LLM-powered).",
            inputSchema={
                "type": "object",
                "properties": {"timeline": {"type": "array", "items": {"type": "object"}}},
                "required": ["timeline"],
            },
        ),
        Tool(
            name="generate_causal_hypothesis",
            description="Synthesize correlated events into a causal narrative (LLM-powered).",
            inputSchema={
                "type": "object",
                "properties": {"correlations": {"type": "array", "items": {"type": "object"}}},
                "required": ["correlations"],
            },
        ),
        Tool(
            name="map_comorbidities",
            description="Map interactions between patient's active conditions (LLM-powered).",
            inputSchema={
                "type": "object",
                "properties": {"events": {"type": "array", "items": {"type": "object"}}},
                "required": ["events"],
            },
        ),
        Tool(
            name="match_clinical_guidelines",
            description="Match patient profile against ADA, JNC, KDIGO, ACC/AHA guidelines (LLM-powered).",
            inputSchema={
                "type": "object",
                "properties": {
                    "events": {"type": "array", "items": {"type": "object"}},
                    "recent_signals": {"type": "array", "items": {"type": "object"}},
                },
                "required": ["events", "recent_signals"],
            },
        ),
        Tool(
            name="generate_recommendations",
            description="Generate 3-5 specific, patient-specific clinical recommendations (LLM-powered).",
            inputSchema={
                "type": "object",
                "properties": {
                    "causal_hypothesis": {"type": "string"},
                    "guideline_matches": {"type": "array", "items": {"type": "object"}},
                    "early_warning": {"type": "object"},
                },
                "required": ["causal_hypothesis", "guideline_matches", "early_warning"],
            },
        ),
        Tool(
            name="generate_unified_brief",
            description="Assemble all pipeline outputs into a structured clinical brief (pure assembly, no LLM).",
            inputSchema={
                "type": "object",
                "properties": {
                    "patient": {"type": "object"},
                    "narrative": {"type": "string"},
                    "turning_points": {"type": "array", "items": {"type": "object"}},
                    "early_warning": {"type": "object"},
                    "causal_hypothesis": {"type": "string"},
                    "comorbidity_map": {"type": "array", "items": {"type": "object"}},
                    "guideline_matches": {"type": "array", "items": {"type": "object"}},
                    "recommendations": {"type": "array", "items": {"type": "object"}},
                },
                "required": [
                    "patient", "narrative", "turning_points", "early_warning",
                    "causal_hypothesis", "comorbidity_map", "guideline_matches",
                    "recommendations",
                ],
            },
        ),
        Tool(
            name="run_full_analysis",
            description=(
                "Run the complete ChronoCare clinical pipeline for a patient in one call. "
                "Wraps all 13 analysis steps (history retrieval, timeline construction, "
                "turning points, narrative, early-warning detection, causal hypothesis, "
                "comorbidity mapping, guideline matching, recommendations, unified brief) "
                "and returns the final unified clinical brief. Use this instead of "
                "orchestrating each tool individually when you want the full analysis."
            ),
            inputSchema={
                "type": "object",
                "properties": {
                    "patient_id": {"type": "string"},
                    "fhir_base_url": {"type": "string"},
                    "fhir_token": {"type": "string"},
                },
                "required": ["patient_id"],
            },
        ),
        Tool(
            name="text_to_speech_brief",
            description="Convert selected clinical brief sections to speech audio.",
            inputSchema={
                "type": "object",
                "properties": {
                    "brief": {"type": "object"},
                    "sections": {
                        "type": "array",
                        "items": {"type": "string"},
                        "default": ["narrative", "early_warning", "recommendations"],
                    },
                },
                "required": ["brief"],
            },
        ),
    ]


@app.call_tool()
async def call_tool(name: str, arguments: dict[str, Any]) -> list[TextContent]:
    result = await _dispatch(name, arguments)
    return [TextContent(type="text", text=json.dumps(result, indent=2))]


async def _dispatch(name: str, args: dict[str, Any]) -> Any:
    fhir = _fhir_ctx.get()
    match name:
        case "get_full_patient_history":
            return await time_traveler.get_full_patient_history(
                patient_id=args.get("patient_id") or fhir.get("patient_id") or "",
                fhir_base_url=args.get("fhir_base_url") or fhir.get("fhir_url") or config.fhir_base_url,
                fhir_token=args.get("fhir_token") or fhir.get("fhir_token") or config.fhir_token or "",
                cache=_cache,
            )
        case "order_events_chronologically":
            return time_traveler.order_events_chronologically(args["history"])
        case "identify_clinical_turning_points":
            return time_traveler.identify_clinical_turning_points(args["timeline"], _llm)
        case "generate_patient_narrative":
            return time_traveler.generate_patient_narrative(
                args["timeline"], args.get("turning_points", []), _llm
            )
        case "get_recent_signals":
            return deterioration.get_recent_signals(
                args["timeline"], args.get("lookback_days", 90)
            )
        case "analyze_weak_patterns":
            return deterioration.analyze_weak_patterns(args["recent_signals"], _llm)
        case "generate_early_warning_report":
            return deterioration.generate_early_warning_report(args["pattern_analysis"], _llm)
        case "correlate_events":
            return root_cause.correlate_events(args["timeline"], _llm)
        case "generate_causal_hypothesis":
            return root_cause.generate_causal_hypothesis(args["correlations"], _llm)
        case "map_comorbidities":
            return recommendations.map_comorbidities(args["events"], _llm)
        case "match_clinical_guidelines":
            return recommendations.match_clinical_guidelines(
                args["events"], args.get("recent_signals", []), _llm
            )
        case "generate_recommendations":
            return recommendations.generate_recommendations(
                args["causal_hypothesis"],
                args.get("guideline_matches", []),
                args.get("early_warning", {}),
                _llm,
            )
        case "generate_unified_brief":
            return synthesis.generate_unified_brief(
                patient=args["patient"],
                narrative=args["narrative"],
                turning_points=args.get("turning_points", []),
                early_warning=args.get("early_warning", {}),
                causal_hypothesis=args.get("causal_hypothesis", ""),
                comorbidity_map=args.get("comorbidity_map", []),
                guideline_matches=args.get("guideline_matches", []),
                recommendations=args.get("recommendations", []),
            )
        case "run_full_analysis":
            return await _run_full_pipeline(
                patient_id=args.get("patient_id") or fhir.get("patient_id") or "",
                fhir_base_url=args.get("fhir_base_url") or fhir.get("fhir_url") or "",
                fhir_token=args.get("fhir_token") or fhir.get("fhir_token") or "",
            )
        case "text_to_speech_brief":
            return text_to_speech_brief(
                brief=args["brief"],
                sections=args.get("sections"),
                openai_api_key=config.openai_api_key,
                google_api_key=config.google_tts_api_key,
            )
        case _:
            return {"error": f"Unknown tool: {name}"}


async def _run_full_pipeline(
    patient_id: str,
    fhir_base_url: str = "",
    fhir_token: str = "",
) -> dict[str, Any]:
    """Run the full 13-step ChronoCare pipeline, return unified brief.

    Five independent reasoning branches execute in parallel via asyncio.gather;
    sync LLM calls are offloaded to worker threads with asyncio.to_thread.
    """
    import asyncio

    history = await time_traveler.get_full_patient_history(
        patient_id=patient_id,
        fhir_base_url=fhir_base_url or config.fhir_base_url,
        fhir_token=fhir_token or config.fhir_token or "",
        cache=_cache,
    )
    timeline = await asyncio.to_thread(time_traveler.order_events_chronologically, history)
    recent_signals = await asyncio.to_thread(deterioration.get_recent_signals, timeline, 90)
    events = history.get("events", []) if isinstance(history, dict) else []

    async def _reconstruct():
        tp = await asyncio.to_thread(
            time_traveler.identify_clinical_turning_points, timeline, _llm
        )
        narr = await asyncio.to_thread(
            time_traveler.generate_patient_narrative, timeline, tp, _llm
        )
        return tp, narr

    async def _detect():
        patterns = await asyncio.to_thread(
            deterioration.analyze_weak_patterns, recent_signals, _llm
        )
        return await asyncio.to_thread(
            deterioration.generate_early_warning_report, patterns, _llm
        )

    async def _explain():
        corr = await asyncio.to_thread(root_cause.correlate_events, timeline, _llm)
        return await asyncio.to_thread(root_cause.generate_causal_hypothesis, corr, _llm)

    async def _comorbid():
        return await asyncio.to_thread(recommendations.map_comorbidities, events, _llm)

    async def _guidelines():
        return await asyncio.to_thread(
            recommendations.match_clinical_guidelines, events, recent_signals, _llm
        )

    (tp, narrative), early_warning, causal_hypothesis, comorbidity_map, guideline_matches = (
        await asyncio.gather(_reconstruct(), _detect(), _explain(), _comorbid(), _guidelines())
    )

    recs = await asyncio.to_thread(
        recommendations.generate_recommendations,
        causal_hypothesis, guideline_matches, early_warning, _llm,
    )
    brief = await asyncio.to_thread(
        synthesis.generate_unified_brief,
        history.get("patient", {}) if isinstance(history, dict) else {},
        narrative, tp, early_warning, causal_hypothesis,
        comorbidity_map, guideline_matches, recs,
    )
    return brief


# ---------------------------------------------------------------------------
# Health endpoint + server bootstrap
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    import uvicorn
    from contextlib import asynccontextmanager
    from starlette.applications import Starlette
    from starlette.middleware.base import BaseHTTPMiddleware
    from starlette.middleware.cors import CORSMiddleware
    from starlette.requests import Request
    from starlette.responses import JSONResponse
    from starlette.routing import Mount, Route

    class FHIRContextMiddleware(BaseHTTPMiddleware):
        async def dispatch(self, request: Request, call_next):
            fhir_url = request.headers.get("X-FHIR-Server-URL", config.fhir_base_url)
            patient_id = request.headers.get("X-Patient-ID", "")
            import logging
            logging.getLogger("chronocare").info(
                "FHIR_CONTEXT fhir_url=%s patient_id=%s", fhir_url, patient_id
            )
            token = _fhir_ctx.set({
                "fhir_url": fhir_url,
                "fhir_token": request.headers.get("X-FHIR-Access-Token", config.fhir_token or ""),
                "patient_id": patient_id,
            })
            try:
                return await call_next(request)
            finally:
                _fhir_ctx.reset(token)

    session_manager = StreamableHTTPSessionManager(
        app=app,
        event_store=None,
        json_response=False,
        stateless=True,
    )

    async def health(request: Request) -> JSONResponse:
        return JSONResponse({
            "status": "ok",
            "version": "1.0.0",
            "tools_count": 15,
            "llm_backend": "gpt-4o+groq-llama3.3",
        })

    async def debug_headers(request: Request) -> JSONResponse:
        """Temporary: expose injected FHIR headers so we can find the real FHIR URL."""
        return JSONResponse({
            "fhir_url": request.headers.get("X-FHIR-Server-URL", ""),
            "fhir_token_present": bool(request.headers.get("X-FHIR-Access-Token")),
            "patient_id": request.headers.get("X-Patient-ID", ""),
        })

    async def admin_add_patient(request: Request) -> JSONResponse:
        """Admin: upload a FHIR R4 bundle as a new patient.

        Auth: X-Admin-Key header must match ADMIN_KEY env var.
        Body: { "bundle": <FHIR transaction Bundle>,
                "fhir_base_url": <optional override> }
        """
        if not config.admin_key:
            return JSONResponse(
                {"ok": False, "error": "ADMIN_KEY not configured on server"},
                status_code=503,
            )
        if request.headers.get("X-Admin-Key") != config.admin_key:
            return JSONResponse({"ok": False, "error": "unauthorized"}, status_code=401)

        try:
            body = await request.json()
        except Exception as exc:
            return JSONResponse({"ok": False, "error": f"invalid json: {exc}"}, status_code=400)

        bundle = body.get("bundle")
        if not isinstance(bundle, dict) or bundle.get("resourceType") != "Bundle":
            return JSONResponse({"ok": False, "error": "missing or invalid 'bundle' (must be a FHIR Bundle)"}, status_code=400)

        entries = bundle.get("entry") or []
        if not entries:
            return JSONResponse({"ok": False, "error": "bundle has no entries"}, status_code=400)

        patients = [e["resource"] for e in entries if e.get("resource", {}).get("resourceType") == "Patient"]
        if len(patients) != 1:
            return JSONResponse({"ok": False, "error": f"bundle must have exactly 1 Patient (found {len(patients)})"}, status_code=400)
        patient_resource = patients[0]
        pid = patient_resource.get("id")
        if not pid:
            return JSONResponse({"ok": False, "error": "Patient resource missing 'id'"}, status_code=400)

        # Rewrite POST -> PUT so the FHIR server preserves the supplied IDs
        rewritten = 0
        for e in entries:
            res = e.get("resource", {})
            rid = res.get("id")
            if rid and (e.get("request") or {}).get("method") == "POST":
                e["request"] = {"method": "PUT", "url": f"{res['resourceType']}/{rid}"}
                rewritten += 1

        target_fhir = body.get("fhir_base_url") or config.fhir_base_url
        headers = {"Content-Type": "application/fhir+json", "Accept": "application/fhir+json"}
        if config.fhir_token:
            headers["Authorization"] = f"Bearer {config.fhir_token}"

        try:
            async with httpx.AsyncClient(timeout=180, follow_redirects=True) as client:
                resp = await client.post(target_fhir.rstrip("/") + "/", json=bundle, headers=headers)
        except Exception as exc:
            return JSONResponse({"ok": False, "error": f"upload failed: {exc}"}, status_code=502)

        if resp.status_code not in (200, 201):
            return JSONResponse(
                {"ok": False, "error": f"FHIR server returned {resp.status_code}", "body": resp.text[:600]},
                status_code=502,
            )

        result = resp.json()
        result_entries = result.get("entry", [])
        success = sum(1 for r in result_entries if (r.get("response", {}).get("status", "")).split(" ", 1)[0] in {"200", "201"})
        name_field = patient_resource.get("name", [{}])[0]
        display_name = " ".join(name_field.get("given", []) + [name_field.get("family", "")]).strip() or "(unnamed)"

        return JSONResponse({
            "ok": True,
            "patient_id": pid,
            "name": display_name,
            "entries_total": len(entries),
            "entries_uploaded": success,
            "post_to_put_rewrites": rewritten,
            "fhir_base_url": target_fhir,
        })

    async def public_demo_voice(request: Request) -> JSONResponse:
        """Public demo endpoint: synthesize speech from a unified brief.

        Body: { "brief": <unified brief>, "sections": ["narrative", ...] }
        Returns: { ok, audio_bytes (base64 MP3), transcript, backend, supported }
        """
        try:
            body = await request.json()
        except Exception as exc:
            return JSONResponse({"ok": False, "error": f"invalid json: {exc}"}, status_code=400)

        brief = body.get("brief")
        if not isinstance(brief, dict):
            return JSONResponse(
                {"ok": False, "error": "missing or invalid 'brief' (must be an object)"},
                status_code=400,
            )

        sections = body.get("sections")
        if sections is not None and not isinstance(sections, list):
            return JSONResponse(
                {"ok": False, "error": "'sections' must be an array of strings"},
                status_code=400,
            )

        result = text_to_speech_brief(
            brief=brief,
            sections=sections,
            openai_api_key=config.openai_api_key,
            google_api_key=config.google_tts_api_key,
        )
        result["ok"] = True
        return JSONResponse(result)

    async def public_demo_analyze(request: Request) -> JSONResponse:
        """Public demo endpoint, runs the full 13-step pipeline for a patient.

        Pipeline structure:
          Sequential head: get_history -> order_chronologically -> get_recent_signals
          Parallel branches (run concurrently via asyncio.gather):
            A: turning_points -> narrative
            B: weak_patterns -> early_warning_report
            C: correlate_events -> causal_hypothesis
            D: map_comorbidities
            E: match_clinical_guidelines
          Sequential tail: generate_recommendations -> generate_unified_brief

        Sync LLM calls run in worker threads via asyncio.to_thread so the five
        branches execute concurrently. Wall-clock typically 12-18s vs 25-35s
        for the sequential variant.

        No auth required. CORS *. Designed for the static GitHub Pages demo.
        """
        import asyncio
        import time as _time

        from chronocare.tools import (
            deterioration as _det,
            recommendations as _rec,
            root_cause as _rc,
            synthesis as _syn,
            time_traveler as _tt,
        )

        try:
            body = await request.json() if request.method == "POST" else {}
        except Exception:
            body = {}

        patient_id = (
            body.get("patient_id")
            or request.query_params.get("patient_id")
            or "d0be5a00-57c5-4417-adeb-824beb93e4c3"
        )
        fhir_base_url = (
            body.get("fhir_base_url")
            or request.query_params.get("fhir_base_url")
            or config.fhir_base_url
        )

        traces: list[dict[str, Any]] = []
        traces_lock = asyncio.Lock()

        async def _record(name: str, t0: float, ok: bool, error: str | None = None):
            entry: dict[str, Any] = {
                "tool": name,
                "ok": ok,
                "latency_ms": int((_time.monotonic() - t0) * 1000),
            }
            if error is not None:
                entry["error"] = error[:200]
            async with traces_lock:
                traces.append(entry)

        async def _run_async(name: str, args: dict[str, Any]):
            """For the one async tool (get_full_patient_history) and unified_brief."""
            t0 = _time.monotonic()
            try:
                result = await _dispatch(name, args)
                await _record(name, t0, True)
                return result
            except Exception as exc:
                await _record(name, t0, False, str(exc))
                raise

        async def _run_sync(name: str, fn, *args):
            """Run a sync tool fn in a worker thread, traced and parallel-safe."""
            t0 = _time.monotonic()
            try:
                result = await asyncio.to_thread(fn, *args)
                await _record(name, t0, True)
                return result
            except Exception as exc:
                await _record(name, t0, False, str(exc))
                raise

        try:
            # Sequential head (must run in order)
            history = await _run_async("get_full_patient_history", {
                "patient_id": patient_id,
                "fhir_base_url": fhir_base_url,
            })
            timeline = await _run_sync(
                "order_events_chronologically", _tt.order_events_chronologically, history
            )
            recent_signals = await _run_sync(
                "get_recent_signals", _det.get_recent_signals, timeline, 90
            )
            events = history.get("events", []) if isinstance(history, dict) else []

            # Five independent branches, run concurrently
            async def branch_reconstruct():
                tp = await _run_sync(
                    "identify_clinical_turning_points",
                    _tt.identify_clinical_turning_points, timeline, _llm,
                )
                narr = await _run_sync(
                    "generate_patient_narrative",
                    _tt.generate_patient_narrative, timeline, tp, _llm,
                )
                return tp, narr

            async def branch_detect():
                patterns = await _run_sync(
                    "analyze_weak_patterns",
                    _det.analyze_weak_patterns, recent_signals, _llm,
                )
                ew = await _run_sync(
                    "generate_early_warning_report",
                    _det.generate_early_warning_report, patterns, _llm,
                )
                return ew

            async def branch_explain():
                corr = await _run_sync(
                    "correlate_events", _rc.correlate_events, timeline, _llm,
                )
                hyp = await _run_sync(
                    "generate_causal_hypothesis", _rc.generate_causal_hypothesis, corr, _llm,
                )
                return hyp

            async def branch_comorbid():
                return await _run_sync(
                    "map_comorbidities", _rec.map_comorbidities, events, _llm,
                )

            async def branch_guidelines():
                return await _run_sync(
                    "match_clinical_guidelines",
                    _rec.match_clinical_guidelines, events, recent_signals, _llm,
                )

            (tp, narrative), early_warning, causal_hypothesis, comorbidity_map, guideline_matches = (
                await asyncio.gather(
                    branch_reconstruct(),
                    branch_detect(),
                    branch_explain(),
                    branch_comorbid(),
                    branch_guidelines(),
                )
            )

            # Sequential tail
            recommendations = await _run_sync(
                "generate_recommendations",
                _rec.generate_recommendations,
                causal_hypothesis, guideline_matches, early_warning, _llm,
            )
            brief = await _run_sync(
                "generate_unified_brief",
                _syn.generate_unified_brief,
                history.get("patient", {}) if isinstance(history, dict) else {},
                narrative,
                tp,
                early_warning,
                causal_hypothesis,
                comorbidity_map,
                guideline_matches,
                recommendations,
            )

            return JSONResponse({"ok": True, "brief": brief, "trace": traces})
        except Exception as exc:
            return JSONResponse(
                {"ok": False, "error": str(exc)[:300], "trace": traces},
                status_code=500,
            )

    @asynccontextmanager
    async def lifespan(app_: Starlette):
        async with session_manager.run():
            yield

    starlette_app = Starlette(
        lifespan=lifespan,
        routes=[
            Route("/health", health),
            Route("/debug-headers", debug_headers),
            Route("/api/demo/analyze", public_demo_analyze, methods=["GET", "POST", "OPTIONS"]),
            Route("/api/demo/voice", public_demo_voice, methods=["POST", "OPTIONS"]),
            Route("/api/admin/patients", admin_add_patient, methods=["POST", "OPTIONS"]),
            Mount("/mcp", session_manager.handle_request),
        ]
    )
    starlette_app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_methods=["GET", "POST", "OPTIONS"],
        allow_headers=["*"],
    )
    starlette_app.add_middleware(FHIRContextMiddleware)
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(starlette_app, host="0.0.0.0", port=port)
