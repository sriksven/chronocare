"""Upload a FHIR bundle to the Prompt Opinion FHIR server.

Usage:
    python scripts/upload_fhir_bundle.py \
        --bundle tests/fixtures/demo_patient_fhir.json \
        --fhir-url https://fhir.promptopinion.ai/workspaces/<workspace-id> \
        --token YOUR_PROMPT_OPINION_FHIR_TOKEN

    # Upload only specific resource types:
    python scripts/upload_fhir_bundle.py ... --resource-types Condition MedicationRequest
"""

from __future__ import annotations

import argparse
import json
import sys

import httpx


def upload_bundle(
    bundle_path: str,
    fhir_url: str,
    token: str,
    resource_types: list[str] | None = None,
) -> None:
    with open(bundle_path) as f:
        bundle = json.load(f)

    if resource_types:
        entries = [
            e for e in bundle.get("entry", [])
            if e.get("resource", {}).get("resourceType") in resource_types
        ]
        bundle = {
            "resourceType": "Bundle",
            "type": "transaction",
            "entry": entries,
        }
        print(f"Filtered to {len(entries)} entries: {resource_types}")

    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/fhir+json",
        "Accept": "application/fhir+json",
    }

    url = fhir_url.rstrip("/") + "/"
    with httpx.Client(timeout=60, follow_redirects=True) as client:
        resp = client.post(url, json=bundle, headers=headers)
        if resp.status_code in (200, 201):
            print(f"Upload successful: {resp.status_code}")
            result = resp.json()
            for entry in result.get("entry", []):
                status = entry.get("response", {}).get("status", "")
                loc = entry.get("response", {}).get("location", "")
                if status or loc:
                    print(f"  {status} {loc}")
        else:
            print(f"Upload failed: {resp.status_code}")
            print(resp.text[:1000])
            sys.exit(1)


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--bundle", required=True)
    parser.add_argument("--fhir-url", required=True)
    parser.add_argument("--token", required=True)
    parser.add_argument(
        "--resource-types",
        nargs="+",
        help="Only upload these resource types (e.g. Condition MedicationRequest)",
    )
    args = parser.parse_args()
    upload_bundle(args.bundle, args.fhir_url, args.token, args.resource_types)
