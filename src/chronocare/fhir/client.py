"""FHIR REST API client.

Makes authenticated calls to the Prompt Opinion FHIR R4 server.
All methods return raw parsed JSON (dict/list). Callers are responsible
for normalization via fhir.normalizer.
"""

from __future__ import annotations

import asyncio
from typing import Any

import httpx

from chronocare.utils.logging import log_tool_call

_RESOURCE_TYPES = [
    "Patient",
    "Condition",
    "Observation",
    "MedicationRequest",
    "Encounter",
    "DocumentReference",
    "DiagnosticReport",
]


class FHIRClient:
    def __init__(self, base_url: str, token: str) -> None:
        self._base_url = base_url
        self._headers: dict[str, str] = {"Accept": "application/fhir+json"}
        if token:
            self._headers["Authorization"] = f"Bearer {token}"

    async def get_patient(self, patient_id: str) -> dict[str, Any]:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.get(
                f"{self._base_url}/Patient/{patient_id}",
                headers=self._headers,
            )
            resp.raise_for_status()
            return resp.json()

    async def search_resources(
        self,
        resource_type: str,
        patient_id: str,
        extra_params: dict[str, str] | None = None,
    ) -> list[dict[str, Any]]:
        params: dict[str, str] = {"patient": patient_id, "_count": "200"}
        if extra_params:
            params.update(extra_params)
        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.get(
                f"{self._base_url}/{resource_type}",
                headers=self._headers,
                params=params,
            )
            resp.raise_for_status()
            bundle = resp.json()
            return [entry["resource"] for entry in bundle.get("entry", [])]

    async def get_all_resources(
        self, patient_id: str
    ) -> dict[str, list[dict[str, Any]]]:
        """Fetch all relevant resource types in parallel."""
        tasks = {
            rt: self.search_resources(rt, patient_id)
            for rt in _RESOURCE_TYPES
            if rt != "Patient"
        }
        results: dict[str, list[dict[str, Any]]] = {}
        for resource_type, coro in tasks.items():
            try:
                results[resource_type] = await coro
            except httpx.HTTPStatusError as exc:
                if exc.response.status_code == 404:
                    results[resource_type] = []
                else:
                    raise
        patient = await self.get_patient(patient_id)
        results["Patient"] = [patient]
        return results
