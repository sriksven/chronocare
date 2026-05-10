"""Voice synthesis — converts clinical brief sections to speech.

Primary: OpenAI TTS (uses the project's existing OPENAI_API_KEY).
Alternate: Google Cloud Text-to-Speech (set GOOGLE_TTS_API_KEY).

Returns a base64-encoded MP3 bytes string. The MCP tool layer is responsible
for writing the bytes to a temp file and returning a URL.
"""

from __future__ import annotations

import base64
from typing import Any

import httpx
from openai import OpenAI

_GOOGLE_TTS_URL = "https://texttospeech.googleapis.com/v1/text:synthesize"
_GOOGLE_DEFAULT_VOICE = "en-US-Neural2-D"
_OPENAI_DEFAULT_MODEL = "tts-1"
_OPENAI_DEFAULT_VOICE = "alloy"


def _render_brief_as_speech_text(
    brief: dict[str, Any],
    sections: list[str],
) -> str:
    """Convert selected brief sections to a readable speech script."""
    parts: list[str] = []

    patient = brief.get("patient_summary", {})
    parts.append(
        f"Clinical brief for {patient.get('name', 'patient')}. "
        f"Generated {brief.get('generated_at', '')[:10]}."
    )

    if "narrative" in sections:
        narrative = brief.get("clinical_narrative", "")
        if narrative:
            parts.append(f"Clinical history. {narrative}")

    if "early_warning" in sections:
        ew = brief.get("early_warning", {})
        risk = ew.get("risk_level", "unknown")
        summary = ew.get("summary", "")
        parts.append(f"Early warning assessment. Risk level: {risk}. {summary}")

    if "recommendations" in sections:
        recs = brief.get("recommendations", [])
        if recs:
            parts.append("Recommendations.")
            for i, rec in enumerate(recs, 1):
                urgency = rec.get("urgency", "routine")
                action = rec.get("action", "")
                rationale = rec.get("rationale", "")
                parts.append(f"Recommendation {i} — {urgency}. {action}. {rationale}")

    return " ".join(parts)


def synthesize_with_openai(
    text: str,
    api_key: str,
    voice: str = _OPENAI_DEFAULT_VOICE,
    model: str = _OPENAI_DEFAULT_MODEL,
) -> bytes:
    """Call OpenAI TTS API and return MP3 bytes."""
    client = OpenAI(api_key=api_key)
    response = client.audio.speech.create(
        model=model,
        voice=voice,
        input=text,
        response_format="mp3",
    )
    return response.read()


def synthesize_with_google(
    text: str,
    api_key: str,
    voice_name: str = _GOOGLE_DEFAULT_VOICE,
) -> bytes:
    """Call Google Cloud TTS API and return MP3 bytes."""
    payload = {
        "input": {"text": text},
        "voice": {
            "languageCode": "en-US",
            "name": voice_name,
            "ssmlGender": "NEUTRAL",
        },
        "audioConfig": {"audioEncoding": "MP3"},
    }
    with httpx.Client(timeout=15) as client:
        resp = client.post(
            _GOOGLE_TTS_URL,
            json=payload,
            params={"key": api_key},
        )
        resp.raise_for_status()
        audio_b64 = resp.json()["audioContent"]
        return base64.b64decode(audio_b64)


def text_to_speech_brief(
    brief: dict[str, Any],
    sections: list[str] | None = None,
    openai_api_key: str | None = None,
    google_api_key: str | None = None,
) -> dict[str, Any]:
    """Convert selected clinical brief sections to speech.

    Backend selection: OpenAI first (if key provided), Google second.
    If neither key is configured, returns supported=False with transcript only.

    Returns dict with 'audio_bytes' (base64 str), 'transcript', 'supported'.
    """
    if sections is None:
        sections = ["narrative", "early_warning", "recommendations"]

    transcript = _render_brief_as_speech_text(brief, sections)

    if openai_api_key:
        try:
            audio_bytes = synthesize_with_openai(transcript, openai_api_key)
            return {
                "supported": True,
                "transcript": transcript,
                "audio_bytes": base64.b64encode(audio_bytes).decode(),
                "backend": "openai",
            }
        except Exception as exc:
            if not google_api_key:
                return {
                    "supported": False,
                    "transcript": transcript,
                    "audio_bytes": None,
                    "error": f"openai tts failed: {exc}",
                }

    if google_api_key:
        try:
            audio_bytes = synthesize_with_google(transcript, google_api_key)
            return {
                "supported": True,
                "transcript": transcript,
                "audio_bytes": base64.b64encode(audio_bytes).decode(),
                "backend": "google",
            }
        except Exception as exc:
            return {
                "supported": False,
                "transcript": transcript,
                "audio_bytes": None,
                "error": f"google tts failed: {exc}",
            }

    return {"supported": False, "transcript": transcript, "audio_bytes": None}
