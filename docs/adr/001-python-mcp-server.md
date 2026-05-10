# ADR-001: Python over Node.js for the MCP server

**Date:** 2026-05-03  
**Status:** Accepted

## Context

We need to implement the ChronoCare MCP server. The official MCP SDK has implementations for both Python and TypeScript/Node.

## Decision

Use Python 3.11.

## Reasons

1. **LLM SDKs** — both the `openai` and `groq` Python clients are first-class, with sync and async support; the project ended up using both providers (see ADR-002)
2. **FHIR ecosystem** — `fhir.resources` and `fhirclient` are Python-native; no comparable TypeScript equivalents
3. **`structlog`** — best-in-class structured logging in Python
4. **Team familiarity** — existing Python expertise

## Consequences

- Slightly higher memory footprint than Node for the same workload (acceptable on Railway free tier)
- Must use `asyncio` for parallel FHIR calls — added complexity but manageable with `httpx`
