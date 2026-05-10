# Hackathon Notes, Agents Assemble

## Submission Details

- **Track:** Path B, A2A Agent powered by a custom MCP Server
- **Platform:** Prompt Opinion
- **Deadline:** May 11, 2026 (Day 9 of sprint)
- **Devpost:** TBD

## Judging Criteria

| Criterion | Weight | Our Score |
|---|---|---|
| AI Factor | High | Strong, 8 LLM calls doing things rule-based software can't |
| Potential Impact | High | Strong, 40-80K diagnostic error deaths/year |
| Feasibility | Medium | Strong, FHIR R4 standard, no training required |

## What Makes Us Win AI Factor

The silent deterioration detector (`analyze_weak_patterns`) is the key differentiator. The prompt explicitly instructs the LLM to:

> "reason across ALL signals together, like an experienced clinician would, and identify whether the combination suggests a pattern of concern. Do not fire on individual thresholds. Reason holistically."

This is categorically impossible with rule-based systems. Rules can say "if creatinine > 2.0, alert." They cannot say "if creatinine is slightly up + BP is slightly high for *this patient's personal target* + fatigue appears in notes twice, this combination warrants attention."

Emphasize this in the demo voiceover and Devpost writeup.

## Demo Video Notes

- Record screen + voiceover (OBS or Loom)
- Run demo with pre-loaded patient data (don't generate Synthea on camera)
- Show tool calls firing in Prompt Opinion debug panel, this is visually impressive
- The "wow moment" is the silent deterioration section: zoom in on "individually_normal_but_together: true"
- Close with marketplace listing (shows production-readiness)

## Platform Notes (Prompt Opinion)

- SHARP extension: passes `patient_id` and `fhir_token` automatically to MCP tools
- A2A routing: set up a General Chat agent that routes to ChronoCore for clinical analysis requests
- Marketplace: publish on Day 8, not Day 9, give buffer time for approval delays

## Risk: Railway Cold Starts

Railway free tier sleeps containers after ~15 min inactivity. First request after sleep takes ~10s.

**Mitigation:** Before recording the demo video, hit the health endpoint to wake the container. Keep the recording session open to stay warm.

## Backup Plan

If Prompt Opinion SHARP context doesn't work:
- Accept `patient_id` + `fhir_token` as explicit tool parameters (already implemented)
- Hardcode the demo patient_id in the A2A agent system prompt as a fallback
