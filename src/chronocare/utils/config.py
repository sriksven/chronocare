"""Environment variable loading and validation.

All configuration is read from environment variables at startup. Missing
required vars raise immediately so Railway logs show a clear failure reason.
"""

import os
from dataclasses import dataclass


@dataclass(frozen=True)
class Config:
    openai_api_key: str
    groq_api_key: str
    mcp_api_key: str
    fhir_base_url: str
    fhir_token: str | None
    log_level: str
    cache_ttl_seconds: int
    google_tts_api_key: str | None
    admin_key: str | None


def load_config() -> Config:
    missing = []
    required = ["OPENAI_API_KEY", "GROQ_API_KEY", "MCP_API_KEY", "FHIR_BASE_URL"]
    for var in required:
        if not os.environ.get(var):
            missing.append(var)
    if missing:
        raise EnvironmentError(f"Missing required environment variables: {', '.join(missing)}")

    return Config(
        openai_api_key=os.environ["OPENAI_API_KEY"],
        groq_api_key=os.environ["GROQ_API_KEY"],
        mcp_api_key=os.environ["MCP_API_KEY"],
        fhir_base_url=os.environ["FHIR_BASE_URL"].rstrip("/"),
        fhir_token=os.environ.get("FHIR_TOKEN"),
        log_level=os.environ.get("LOG_LEVEL", "INFO"),
        cache_ttl_seconds=int(os.environ.get("CACHE_TTL_SECONDS", "300")),
        google_tts_api_key=os.environ.get("GOOGLE_TTS_API_KEY"),
        admin_key=os.environ.get("ADMIN_KEY"),
    )
