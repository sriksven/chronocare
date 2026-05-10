"""Unit tests for TTL cache."""

import time
from unittest.mock import patch

import pytest
from chronocare.fhir.cache import TTLCache


def test_set_and_get():
    cache = TTLCache(ttl_seconds=60)
    cache.set("key1", {"data": 42})
    assert cache.get("key1") == {"data": 42}


def test_miss_returns_none():
    cache = TTLCache(ttl_seconds=60)
    assert cache.get("nonexistent") is None


def test_expiry():
    cache = TTLCache(ttl_seconds=1)
    cache.set("key1", "value")
    # Manually expire by manipulating the stored timestamp
    key = "key1"
    cache._store[key] = (cache._store[key][0], time.monotonic() - 1)
    assert cache.get("key1") is None


def test_invalidate():
    cache = TTLCache(ttl_seconds=60)
    cache.set("key1", "value")
    cache.invalidate("key1")
    assert cache.get("key1") is None


def test_clear():
    cache = TTLCache(ttl_seconds=60)
    cache.set("k1", "v1")
    cache.set("k2", "v2")
    cache.clear()
    assert cache.get("k1") is None
    assert cache.get("k2") is None


def test_invalidate_nonexistent_is_safe():
    cache = TTLCache(ttl_seconds=60)
    cache.invalidate("does_not_exist")  # should not raise
