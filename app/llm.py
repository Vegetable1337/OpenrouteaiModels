import asyncio
import logging
from typing import Any, Dict, List

import httpx
from fastapi import HTTPException, status

from app.config import Settings
from app.models import ChatMessage
from app.prompts import SEARCH_QUERY_PROMPT


logger = logging.getLogger(__name__)


class OpenRouterClient:
    def __init__(self, settings: Settings) -> None:
        self._settings = settings

    async def complete(self, messages: List[ChatMessage], temperature: float = 0.35) -> str:
        if not self._settings.openrouter_api_key:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="OPENROUTER_API_KEY is not configured.",
            )

        payload: Dict[str, Any] = {
            "model": self._settings.openrouter_model,
            "messages": [message.model_dump() for message in messages],
            "temperature": temperature,
        }
        headers = {
            "Authorization": f"Bearer {self._settings.openrouter_api_key}",
            "Content-Type": "application/json",
            "HTTP-Referer": self._settings.openrouter_referer,
            "X-Title": self._settings.openrouter_title,
        }
        url = f"{self._settings.openrouter_base_url.rstrip('/')}/chat/completions"
        last_error: Exception | None = None

        for attempt in range(self._settings.request_retries + 1):
            try:
                timeout = httpx.Timeout(self._settings.request_timeout_seconds)
                async with httpx.AsyncClient(timeout=timeout) as client:
                    response = await client.post(url, headers=headers, json=payload)
                    response.raise_for_status()
                    data = response.json()
                return str(data["choices"][0]["message"]["content"]).strip()
            except (httpx.HTTPError, KeyError, IndexError, ValueError) as exc:
                last_error = exc
                logger.warning("OpenRouter request failed on attempt %s: %s", attempt + 1, exc)
                if attempt < self._settings.request_retries:
                    await asyncio.sleep(0.5 * (attempt + 1))

        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"OpenRouter request failed: {last_error}",
        )

    async def build_search_query(self, user_message: str) -> str:
        query = await self.complete(
            [
                ChatMessage(role="system", content=SEARCH_QUERY_PROMPT),
                ChatMessage(role="user", content=user_message),
            ],
            temperature=0.1,
        )
        return query.strip().strip('"').strip("'")[:300] or user_message[:300]
