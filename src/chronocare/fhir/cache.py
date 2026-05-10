"""In-memory TTL cache for FHIR responses.

FHIR data is static in the demo environment. Caching avoids repeated
round-trips on the 13-tool pipeline for the same patient_id.

Key format: "{patient_id}:{resource_type}" (or "all" for full fetch).
TTL is read from Config.cache_ttl_seconds (default 300s).
"""

from __future__ import annotations

import time
from typing import Any


class TTLCache:
    def __init__(self, ttl_seconds: int = 300) -> None:
        self._ttl = ttl_seconds
        self._store: dict[str, tuple[Any, float]] = {}

    def get(self, key: str) -> Any | None:
        entry = self._store.get(key)
        if entry is None:
            return None
        value, expires_at = entry
        if time.monotonic() > expires_at:
            del self._store[key]
            return None
        return value

    def set(self, key: str, value: Any) -> None:
        self._store[key] = (value, time.monotonic() + self._ttl)

    def invalidate(self, key: str) -> None:
        self._store.pop(key, None)

    def clear(self) -> None:
        self._store.clear()
