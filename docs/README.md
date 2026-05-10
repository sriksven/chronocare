# ChronoCare — Docs

Architecture, ADRs, runbooks, API reference, and research notes.

## Folder Map

| Folder | What's in it |
|---|---|
| [architecture/](architecture/) | System diagrams, data flow, component decisions |
| [api/](api/) | MCP tool reference, brief schema |
| [adr/](adr/) | Architecture Decision Records |
| [runbooks/](runbooks/) | Operational procedures: deploy, debug |
| [research/](research/) | Clinical background, hackathon notes, sprint plan |

## Quick Links

- [Architecture Overview](architecture/overview.md)
- [Data Flow](architecture/data_flow.md)
- [MCP Tool Reference](api/mcp_tools.md)
- [Unified Brief Schema](api/brief_schema.md)
- [Deployment Runbook](runbooks/deployment.md)
- [Debug Runbook](runbooks/debugging.md)
- [Day-by-Day Sprint Plan](research/sprint_plan.md) — also contains the ChronoCore A2A system prompt
- [ADR-001: Python over Node for MCP](adr/001-python-mcp-server.md)
- [ADR-002: Multi-model routing — GPT-4o + Groq Llama-3.3-70b](adr/002-claude-haiku.md)
- [ADR-003: In-memory cache over Redis](adr/003-in-memory-cache.md)
