from __future__ import annotations

from enum import Enum

from engine.config import get_settings


class Task(str, Enum):
    """Gateway tasks. Routing is by task, never by hardcoded provider."""

    OCR_CLEANUP = "ocr_cleanup"
    CLASSIFICATION = "classification"
    EXTRACTION = "extraction"
    REASONING = "reasoning"
    EMBEDDING = "embedding"


def model_for(task: Task) -> str:
    s = get_settings()
    return {
        Task.OCR_CLEANUP: s.model_ocr_cleanup,
        Task.CLASSIFICATION: s.model_classification,
        Task.EXTRACTION: s.model_extraction,
        Task.REASONING: s.model_reasoning,
        Task.EMBEDDING: s.model_embedding,
    }[task]
