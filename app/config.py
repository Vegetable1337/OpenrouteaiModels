from functools import lru_cache
import os
from typing import List

from dotenv import load_dotenv
from pydantic import Field
from pydantic.dataclasses import dataclass


load_dotenv()


def _split_csv(value: str) -> List[str]:
    return [item.strip() for item in value.split(",") if item.strip()]


@dataclass(frozen=True)
class Settings:
    app_name: str = "Aether Search Agent"
    log_level: str = Field(default_factory=lambda: os.getenv("LOG_LEVEL", "INFO"))
    cors_origins: List[str] = Field(
        default_factory=lambda: _split_csv(
            os.getenv(
                "CORS_ORIGINS",
                "http://localhost:5173,http://127.0.0.1:5173",
            )
        )
    )

    openrouter_api_key: str = Field(default_factory=lambda: os.getenv("OPENROUTER_API_KEY", ""))
    openrouter_base_url: str = Field(
        default_factory=lambda: os.getenv("OPENROUTER_BASE_URL", "https://openrouter.ai/api/v1")
    )
    openrouter_model: str = Field(
        default_factory=lambda: os.getenv("OPENROUTER_MODEL", "openai/gpt-oss-120b:free")
    )
    openrouter_referer: str = Field(
        default_factory=lambda: os.getenv("OPENROUTER_REFERER", "http://localhost:8000")
    )
    openrouter_title: str = Field(default_factory=lambda: os.getenv("OPENROUTER_TITLE", "Aether Local Search Agent"))

    searxng_url: str = Field(default_factory=lambda: os.getenv("SEARXNG_URL", "http://localhost:8080"))
    search_top_k: int = Field(default_factory=lambda: int(os.getenv("SEARCH_TOP_K", "5")))
    request_timeout_seconds: float = Field(default_factory=lambda: float(os.getenv("REQUEST_TIMEOUT_SECONDS", "20")))
    request_retries: int = Field(default_factory=lambda: int(os.getenv("REQUEST_RETRIES", "2")))


@lru_cache
def get_settings() -> Settings:
    return Settings()
