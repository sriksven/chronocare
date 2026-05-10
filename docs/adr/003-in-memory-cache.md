# ADR-003: In-memory TTL cache instead of Redis

**Date:** 2026-05-03  
**Status:** Accepted

## Context

The pipeline makes repeated FHIR calls for the same patient across 13 tools. We need to cache to avoid redundant latency.

## Decision

Simple Python dict-based TTL cache (`src/chronocare/fhir/cache.py`), not Redis.

## Reasons

1. **Single instance**, Railway free tier runs one container. No distributed cache needed.
2. **Demo environment**, FHIR data doesn't change between calls. 5-minute TTL is plenty.
3. **Zero dependencies**, No Redis container, no connection pooling, no infrastructure overhead.
4. **Simplicity**, 30 lines of Python vs. managing a Redis service.

## Consequences

- Cache is lost on container restart (acceptable, Railway restarts are rare, and a cold start just refetches from FHIR)
- Not suitable if we ever scale to multiple instances (would need Redis or a shared cache layer)
- Memory bounded by number of unique patient_ids × size of normalized history (~50KB per patient), not a concern for a demo
