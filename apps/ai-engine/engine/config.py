from __future__ import annotations

from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_prefix="ENGINE_", env_file=".env", extra="ignore")

    database_url: str = "sqlite:///./engine.db"
    # Comma-separated service tokens accepted from callers (platform, integrations).
    service_tokens: str = "dev-service-token"
    # mock: deterministic rule-based extraction, no external calls (dev/tests).
    # live: LLM extraction through the AI Gateway (requires provider keys + [live] extra).
    gateway_mode: str = "mock"
    # Task routing table; overridable per deployment. Keys are gateway task names.
    model_ocr_cleanup: str = "gpt-4o-mini"
    model_classification: str = "gpt-4o-mini"
    model_extraction: str = "claude-sonnet-4-5"
    model_reasoning: str = "claude-fable-5"
    model_embedding: str = "text-embedding-3-small"
    storage_dir: str = "./engine-storage"
    max_upload_mb: int = 100

    @property
    def token_set(self) -> set[str]:
        return {t.strip() for t in self.service_tokens.split(",") if t.strip()}


@lru_cache
def get_settings() -> Settings:
    return Settings()
