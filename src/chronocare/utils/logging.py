"""Structured logging setup using structlog.

All tool calls are logged with: tool_name, patient_id (hashed), latency_ms,
success/error. LLM calls log model + token counts but never prompt content.
"""

import hashlib
import logging
import time
from contextlib import contextmanager
from typing import Generator

import structlog


def setup_logging(level: str = "INFO") -> None:
    logging.basicConfig(
        format="%(message)s",
        level=getattr(logging, level.upper(), logging.INFO),
    )
    structlog.configure(
        processors=[
            structlog.stdlib.add_log_level,
            structlog.stdlib.add_logger_name,
            structlog.processors.TimeStamper(fmt="iso"),
            structlog.processors.StackInfoRenderer(),
            structlog.processors.JSONRenderer(),
        ],
        wrapper_class=structlog.stdlib.BoundLogger,
        context_class=dict,
        logger_factory=structlog.stdlib.LoggerFactory(),
    )


def hash_patient_id(patient_id: str) -> str:
    """One-way hash so patient IDs never appear in logs."""
    return hashlib.sha256(patient_id.encode()).hexdigest()[:12]


@contextmanager
def log_tool_call(tool_name: str, patient_id: str) -> Generator[None, None, None]:
    log = structlog.get_logger()
    hashed = hash_patient_id(patient_id)
    start = time.monotonic()
    try:
        yield
        elapsed_ms = int((time.monotonic() - start) * 1000)
        log.info("tool_call", tool=tool_name, patient=hashed, latency_ms=elapsed_ms, status="ok")
    except Exception as exc:
        elapsed_ms = int((time.monotonic() - start) * 1000)
        log.error("tool_call", tool=tool_name, patient=hashed, latency_ms=elapsed_ms, status="error", error=str(exc))
        raise
