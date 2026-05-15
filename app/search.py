import asyncio
import logging
import re
from typing import Any, Dict, List

import httpx

from app.config import Settings
from app.models import SearchResult


logger = logging.getLogger(__name__)

RECENT_TERMS = {
    "today",
    "latest",
    "news",
    "current",
    "now",
    "price",
    "schedule",
    "weather",
    "release",
    "update",
    "2025",
    "2026",
    "сегодня",
    "последн",
    "новост",
    "сейчас",
    "цена",
    "курс",
    "погода",
    "расписание",
    "обновлен",
    "вышел",
}


def needs_web_search(query: str) -> bool:
    normalized = query.strip().lower()
    if not normalized:
        return False
    if re.search(r"https?://|www\.", normalized):
        return True
    if "?" in normalized and any(term in normalized for term in RECENT_TERMS):
        return True
    if any(term in normalized for term in RECENT_TERMS):
        return True
    if re.search(r"\b(кто|что|где|когда|сколько)\b.*\b(сейчас|сегодня|последн)", normalized):
        return True
    if re.search(r"\b(who|what|where|when|how much)\b.*\b(now|today|latest|current)", normalized):
        return True
    return False


class SearchClient:
    def __init__(self, settings: Settings) -> None:
        self._settings = settings

    async def search(self, query: str, limit: int | None = None) -> List[SearchResult]:
        top_k = limit or self._settings.search_top_k
        params: Dict[str, Any] = {
            "q": query,
            "format": "json",
            "language": "auto",
            "safesearch": 1,
        }
        url = f"{self._settings.searxng_url.rstrip('/')}/search"
        last_error: Exception | None = None

        for attempt in range(self._settings.request_retries + 1):
            try:
                timeout = httpx.Timeout(self._settings.request_timeout_seconds)
                async with httpx.AsyncClient(timeout=timeout) as client:
                    response = await client.get(url, params=params)
                    response.raise_for_status()
                    payload = response.json()
                return self._parse_results(payload, top_k)
            except (httpx.HTTPError, ValueError) as exc:
                last_error = exc
                logger.warning("SearXNG search failed on attempt %s: %s", attempt + 1, exc)
                if attempt < self._settings.request_retries:
                    await asyncio.sleep(0.4 * (attempt + 1))

        raise RuntimeError(f"SearXNG search failed: {last_error}") from last_error

    @staticmethod
    def _parse_results(payload: Dict[str, Any], limit: int) -> List[SearchResult]:
        items = payload.get("results", [])
        results: List[SearchResult] = []

        for item in items:
            title = str(item.get("title") or "").strip()
            url = str(item.get("url") or "").strip()
            if not title or not url:
                continue
            results.append(
                SearchResult(
                    title=title,
                    url=url,
                    content=str(item.get("content") or item.get("snippet") or "").strip(),
                    engine=str(item.get("engine") or "") or None,
                    score=float(item["score"]) if item.get("score") is not None else None,
                )
            )
            if len(results) >= limit:
                break

        return results
