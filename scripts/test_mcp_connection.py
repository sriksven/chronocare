"""Smoke test the live MCP server connection.

Run after Railway deployment to verify all 14 tools are reachable.

Usage:
    python scripts/test_mcp_connection.py \
        --url https://chronocare-mcp.railway.app \
        --key YOUR_MCP_API_KEY
"""

from __future__ import annotations

import argparse
import sys

import httpx

EXPECTED_TOOLS = [
    "get_full_patient_history",
    "order_events_chronologically",
    "identify_clinical_turning_points",
    "generate_patient_narrative",
    "get_recent_signals",
    "analyze_weak_patterns",
    "generate_early_warning_report",
    "correlate_events",
    "generate_causal_hypothesis",
    "map_comorbidities",
    "match_clinical_guidelines",
    "generate_recommendations",
    "generate_unified_brief",
    "text_to_speech_brief",
]


def main(url: str, api_key: str) -> None:
    base = url.rstrip("/")

    # Health check
    with httpx.Client(timeout=15) as client:
        resp = client.get(f"{base}/health")
        if resp.status_code != 200:
            print(f"FAIL: health check returned {resp.status_code}")
            sys.exit(1)
        health = resp.json()
        print(f"Health: {health}")

        # MCP tools list — Streamable HTTP requires trailing slash + SSE Accept
        headers = {
            "X-ChronoCare-Key": api_key,
            "Content-Type": "application/json",
            "Accept": "application/json, text/event-stream",
        }
        resp = client.post(
            f"{base}/mcp/",
            json={"jsonrpc": "2.0", "id": 1, "method": "tools/list", "params": {}},
            headers=headers,
        )
        if resp.status_code != 200:
            print(f"FAIL: tools/list returned {resp.status_code}")
            sys.exit(1)

        # Response is SSE: parse the data: line
        body = resp.text
        result = None
        for line in body.splitlines():
            if line.startswith("data:"):
                import json as _json
                result = _json.loads(line[5:].strip())
                break
        if result is None:
            print(f"FAIL: no data line in SSE response")
            sys.exit(1)

        tool_names = [t["name"] for t in result.get("result", {}).get("tools", [])]
        print(f"Tools found: {len(tool_names)}")

        missing = set(EXPECTED_TOOLS) - set(tool_names)
        if missing:
            print(f"FAIL: missing tools: {missing}")
            sys.exit(1)

        print("All tools present. MCP server OK.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--url", default="http://localhost:8000")
    parser.add_argument("--key", required=True)
    args = parser.parse_args()
    main(args.url, args.key)
