"""All LLM prompt templates for ChronoCare reasoning steps.

Each function returns a (system_prompt, user_prompt) tuple ready to pass
to the LLM client. Prompts are kept here rather than inline in tool files
so they can be reviewed, iterated, and tested in isolation.

Temperature guidance (enforced in llm_client.py):
  - 0.2 for reasoning/analysis steps (reproducibility > creativity)
  - 0.5 for narrative generation (readable prose)
"""

from __future__ import annotations

import json
from typing import Any


def turning_points_prompt(timeline_json: str) -> tuple[str, str]:
    system = (
        "You are a clinical analyst with deep expertise in longitudinal patient care. "
        "You identify key inflection points in a patient's medical history — moments "
        "where trajectory changed. You ONLY reference data explicitly present in the "
        "timeline provided. You never fabricate findings. Use hedged clinical language: "
        "'appears to indicate', 'may suggest', 'warrants further investigation'."
    )
    user = (
        f"Below is a patient's full chronological event timeline in JSON format.\n\n"
        f"{timeline_json}\n\n"
        "Identify the 3-5 moments that most significantly changed this patient's clinical "
        "trajectory. For each turning point, provide:\n"
        "1. date (ISO format)\n"
        "2. event description\n"
        "3. clinical significance (1-2 sentences explaining why this was a turning point)\n\n"
        "Respond ONLY with a JSON array. Each element: "
        '{"date": "...", "event": "...", "significance": "..."}'
    )
    return system, user


def narrative_prompt(timeline_json: str, turning_points_json: str) -> tuple[str, str]:
    system = (
        "You are an experienced hospitalist physician writing a handoff brief. "
        "Your narratives are clear, specific, and chronological. You cite actual dates "
        "and values from the data. You write for an incoming physician who has never "
        "seen this patient. You ONLY reference data in the provided timeline."
    )
    user = (
        f"Patient timeline:\n{timeline_json}\n\n"
        f"Key turning points:\n{turning_points_json}\n\n"
        "Write a 200-300 word clinical narrative for this patient. Tell the story of "
        "their medical history chronologically, connecting the turning points into a "
        "coherent clinical story. Be specific with dates and findings. "
        "Write in plain English, not bullet points."
    )
    return system, user


def weak_patterns_prompt(recent_signals_json: str) -> tuple[str, str]:
    system = (
        "You are an experienced ICU nurse with 20 years of bedside experience. "
        "You have a gift for sensing when a patient is about to deteriorate before "
        "the numbers formally cross thresholds. You reason holistically across ALL "
        "signals together — not individual values in isolation. "
        "You NEVER fire false alarms on truly normal, stable patients. "
        "You ONLY reference signals present in the data provided."
    )
    user = (
        f"Below are recent clinical signals for a patient (past 90 days):\n\n"
        f"{recent_signals_json}\n\n"
        "Each signal may be individually within normal range. Your job: reason across "
        "ALL signals together — like an experienced clinician would — and identify "
        "whether the combination suggests a pattern of concern.\n\n"
        "Respond with JSON:\n"
        '{"risk_level": "low|medium|high", '
        '"signal_clusters": [{"signals": [...], "pattern": "...", "concern": "..."}], '
        '"overall_assessment": "...", '
        '"individually_normal_but_together": true|false}'
    )
    return system, user


def early_warning_prompt(pattern_analysis_json: str) -> tuple[str, str]:
    system = (
        "You are a patient safety officer converting a clinical pattern analysis into "
        "a structured early warning report. You write concisely and actionably. "
        "Risk levels: low (routine monitoring), medium (heightened attention, consider "
        "intervention), high (immediate clinical evaluation needed)."
    )
    user = (
        f"Pattern analysis:\n{pattern_analysis_json}\n\n"
        "Generate a structured early warning report. Respond with JSON:\n"
        '{"risk_level": "low|medium|high", '
        '"key_signals": ["..."], '
        '"trend_direction": "stable|worsening|improving", '
        '"time_sensitivity": "routine|urgent|emergent", '
        '"recommended_monitoring": "...", '
        '"summary": "..."}'
    )
    return system, user


def correlate_events_prompt(timeline_json: str) -> tuple[str, str]:
    system = (
        "You are a clinical epidemiologist specializing in causal inference in patient "
        "outcomes. You identify plausible causal relationships between clinical events. "
        "You assign confidence levels honestly: high only when the causal pathway is "
        "well-established in clinical literature. You ONLY reference events in the "
        "provided timeline."
    )
    user = (
        f"Patient timeline:\n{timeline_json}\n\n"
        "Identify pairs of events where one likely caused or contributed to the other. "
        "Focus on clinically meaningful relationships (medication changes → lab changes, "
        "uncontrolled conditions → new diagnoses, etc.).\n\n"
        "Respond with JSON array. Each element:\n"
        '{"cause_event": "...", "cause_date": "...", '
        '"effect_event": "...", "effect_date": "...", '
        '"confidence": "low|medium|high", "rationale": "..."}'
    )
    return system, user


def causal_hypothesis_prompt(correlations_json: str) -> tuple[str, str]:
    system = (
        "You are a clinical reasoning expert writing a hypothesis for a case conference. "
        "You synthesize multiple correlations into a coherent causal narrative. "
        "You use appropriate uncertainty language. You ONLY draw on the correlations provided."
    )
    user = (
        f"Correlated event pairs:\n{correlations_json}\n\n"
        "Write a 150-word causal hypothesis explaining the most likely reason key "
        "clinical outcomes occurred. Connect the causal chain clearly. "
        "Use hedged language where confidence is low."
    )
    return system, user


def comorbidity_map_prompt(conditions_json: str) -> tuple[str, str]:
    system = (
        "You are an internal medicine physician expert in multimorbidity. "
        "You map interactions between coexisting conditions and explain how "
        "each condition influences the others."
    )
    user = (
        f"Active conditions:\n{conditions_json}\n\n"
        "Create a comorbidity interaction map. For each pair of interacting conditions, "
        "explain how one affects the other.\n\n"
        "Respond with JSON array. Each element:\n"
        '{"condition_a": "...", "condition_b": "...", '
        '"interaction": "...", "clinical_significance": "low|medium|high"}'
    )
    return system, user


def guidelines_prompt(conditions_json: str, medications_json: str, signals_json: str) -> tuple[str, str]:
    system = (
        "You are a clinical pharmacist and evidence-based medicine specialist. "
        "You apply major clinical guidelines (ADA, JNC, KDIGO, ACC/AHA) to a "
        "specific patient's profile. You only cite guidelines relevant to this "
        "patient's actual conditions. You note gaps between current treatment and "
        "guideline recommendations."
    )
    user = (
        f"Active conditions:\n{conditions_json}\n\n"
        f"Current medications:\n{medications_json}\n\n"
        f"Recent signals:\n{signals_json}\n\n"
        "Identify relevant clinical guideline recommendations for this patient. "
        "Note any gaps between current management and guideline standards.\n\n"
        "Respond with JSON array. Each element:\n"
        '{"guideline": "...", "recommendation": "...", '
        '"current_status": "met|gap|unknown", "note": "..."}'
    )
    return system, user


def recommendations_prompt(
    causal_hypothesis: str,
    guideline_matches_json: str,
    early_warning_json: str,
) -> tuple[str, str]:
    system = (
        "You are a senior attending physician generating a specific, actionable, "
        "evidence-based clinical action plan. Every recommendation must reference "
        "this patient's specific findings — not generic advice. "
        "You prioritize by urgency. You use clinical precision while remaining "
        "accessible to any physician. Limit to 3-5 recommendations."
    )
    user = (
        f"Causal hypothesis:\n{causal_hypothesis}\n\n"
        f"Guideline matches:\n{guideline_matches_json}\n\n"
        f"Early warning report:\n{early_warning_json}\n\n"
        "Generate 3-5 specific, actionable, patient-specific clinical recommendations. "
        "Each must cite a specific finding from this patient's data.\n\n"
        "Respond with JSON array. Each element:\n"
        '{"priority": 1, "action": "...", "rationale": "...", '
        '"specific_finding": "...", "urgency": "routine|urgent|emergent"}'
    )
    return system, user
