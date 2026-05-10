"""Admin CLI: add a new patient to the demo by uploading their FHIR bundle.

Single-command workflow: validate bundle → preserve IDs → upload to a FHIR R4
server → optionally register in the frontend catalog. Can target HAPI public
sandbox (default) or any authenticated FHIR R4 server.

Usage:

  # Upload to HAPI public sandbox (default — no auth needed)
  python3 scripts/admin_add_patient.py path/to/bundle.json

  # Upload + register in frontend catalog with metadata
  python3 scripts/admin_add_patient.py path/to/bundle.json \\
    --register \\
    --age 64 \\
    --story "Recurrent UTIs progressing to pyelonephritis" \\
    --conditions "recurrent UTI,pyelonephritis,early CKD"

  # Upload to a custom FHIR R4 server with bearer auth
  python3 scripts/admin_add_patient.py path/to/bundle.json \\
    --fhir-url https://my-fhir-server.example.com/fhir \\
    --fhir-token "$MY_TOKEN"

The bundle must be a FHIR R4 transaction Bundle with a Patient resource that
has an id field. POST entries are auto-rewritten to PUT so the supplied ID
is preserved across the upload (otherwise references inside the bundle break).
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

import httpx

DEFAULT_FHIR = "https://hapi.fhir.org/baseR4"
ROOT = Path(__file__).parent.parent
CATALOG_PATH = ROOT / "frontend" / "src" / "lib" / "patients.ts"


def load_bundle(path: Path) -> dict:
    with path.open() as f:
        bundle = json.load(f)
    if bundle.get("resourceType") != "Bundle":
        raise SystemExit(f"❌ {path}: not a FHIR Bundle (resourceType={bundle.get('resourceType')})")
    if not bundle.get("entry"):
        raise SystemExit(f"❌ {path}: bundle has no entries")
    return bundle


def find_patient(bundle: dict) -> dict:
    patients = [e["resource"] for e in bundle["entry"] if e["resource"].get("resourceType") == "Patient"]
    if not patients:
        raise SystemExit("❌ Bundle has no Patient resource")
    if len(patients) > 1:
        raise SystemExit(f"❌ Bundle has {len(patients)} Patient resources — expected exactly 1")
    p = patients[0]
    if not p.get("id"):
        raise SystemExit("❌ Patient resource has no id field — required to preserve references")
    return p


def patient_label(p: dict) -> str:
    name = p.get("name", [{}])[0]
    given = " ".join(name.get("given", []))
    family = name.get("family", "")
    return f"{given} {family}".strip() or "(unnamed)"


def convert_post_to_put(bundle: dict) -> int:
    """Rewrite POST entries to PUT so HAPI/FHIR servers preserve our IDs.

    Returns the number of entries rewritten.
    """
    converted = 0
    for entry in bundle.get("entry", []):
        res = entry["resource"]
        rid = res.get("id")
        if rid and entry.get("request", {}).get("method") == "POST":
            entry["request"] = {
                "method": "PUT",
                "url": f"{res['resourceType']}/{rid}",
            }
            converted += 1
    return converted


def upload(bundle: dict, fhir_url: str, fhir_token: str | None) -> dict:
    headers = {
        "Content-Type": "application/fhir+json",
        "Accept": "application/fhir+json",
    }
    if fhir_token:
        headers["Authorization"] = f"Bearer {fhir_token}"

    base = fhir_url.rstrip("/") + "/"
    print(f"→ Uploading to {base} ...")
    with httpx.Client(timeout=180, follow_redirects=True) as c:
        resp = c.post(base, json=bundle, headers=headers)
    if resp.status_code not in (200, 201):
        print(f"❌ Upload failed: HTTP {resp.status_code}")
        print(resp.text[:1500])
        raise SystemExit(2)
    return resp.json()


def report(result: dict, expected_total: int) -> None:
    entries = result.get("entry", [])
    by_status: dict[str, int] = {}
    for entry in entries:
        status = entry.get("response", {}).get("status", "?").split(" ", 1)[0]
        by_status[status] = by_status.get(status, 0) + 1
    print(f"✓ Server returned {len(entries)} entries (expected {expected_total})")
    for status, n in sorted(by_status.items()):
        print(f"    {status}: {n}")


def append_to_catalog(
    pid: str, name: str, age: str, sex: str, story: str, conditions: list[str]
) -> None:
    if not CATALOG_PATH.exists():
        print(f"⚠ Catalog not found at {CATALOG_PATH} — skipping registration")
        return
    text = CATALOG_PATH.read_text()
    # Insert before the closing `];` of DEMO_PATIENTS
    new_entry = (
        "  {\n"
        f"    id: {json.dumps(pid)},\n"
        f"    name: {json.dumps(name)},\n"
        f"    age: {json.dumps(age)},\n"
        f"    sex: {json.dumps(sex)},\n"
        f"    story: {json.dumps(story)},\n"
        f"    conditions: {json.dumps(conditions)},\n"
        "  },\n"
    )
    if pid in text:
        print(f"⚠ Patient {pid} already in catalog — not appending again")
        return
    if "];" not in text:
        print(f"⚠ Catalog format unexpected — please add manually:\n{new_entry}")
        return
    text = text.replace("];", new_entry + "];", 1)
    CATALOG_PATH.write_text(text)
    print(f"✓ Registered in {CATALOG_PATH.relative_to(ROOT)}")


def main() -> None:
    ap = argparse.ArgumentParser(description="Upload a FHIR bundle and register the patient.")
    ap.add_argument("bundle", type=Path, help="Path to FHIR R4 transaction bundle (JSON)")
    ap.add_argument("--fhir-url", default=DEFAULT_FHIR, help=f"FHIR base URL (default: {DEFAULT_FHIR})")
    ap.add_argument("--fhir-token", default="", help="Bearer token (omit for HAPI public)")
    ap.add_argument("--register", action="store_true", help="Append to the frontend patient catalog")
    ap.add_argument("--age", default="?", help="Patient age (for catalog)")
    ap.add_argument("--story", default="", help="One-line clinical story (for catalog)")
    ap.add_argument("--conditions", default="", help="Comma-separated condition tags (for catalog)")
    args = ap.parse_args()

    if not args.bundle.exists():
        sys.exit(f"❌ Bundle not found: {args.bundle}")

    bundle = load_bundle(args.bundle)
    patient = find_patient(bundle)
    pid = patient["id"]
    name = patient_label(patient)
    sex = patient.get("gender", "unknown")

    print(f"Patient: {name} (id={pid}, sex={sex})")
    print(f"Bundle:  {len(bundle['entry'])} entries")

    converted = convert_post_to_put(bundle)
    if converted:
        print(f"→ Rewrote {converted} POST entries to PUT (preserves IDs)")

    result = upload(bundle, args.fhir_url, args.fhir_token or None)
    report(result, len(bundle["entry"]))

    print()
    print(f"✓ Patient ID: {pid}")
    print(f"  Verify:    curl '{args.fhir_url.rstrip('/')}/Patient/{pid}'")

    if args.register:
        if not args.story:
            print("⚠ --register requires --story (one-line clinical summary)")
            return
        conditions = [c.strip() for c in args.conditions.split(",") if c.strip()]
        append_to_catalog(pid, name, args.age, sex, args.story, conditions)
        print()
        print("Next: rebuild the frontend so the patient appears in the picker:")
        print("  cd frontend && npm run build")
        print("Then commit + push so GitHub Pages redeploys.")


if __name__ == "__main__":
    main()
