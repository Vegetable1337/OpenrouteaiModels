from typing import Iterable

from app.models import SearchResult


SYSTEM_PROMPT = """You are a helpful AI assistant.
Use the supplied web context when it is present.
If the context does not contain enough information, say what is missing and answer carefully.
Always keep the answer grounded, concise, and useful.
Do not include raw URLs, source lists, citations, footnotes, or "Sources" sections in the answer text.
The application shows sources separately."""


SEARCH_QUERY_PROMPT = """Rewrite the user's request as a concise web-search query.
Return only the query text, no quotes and no explanation."""


def build_search_context(results: Iterable[SearchResult]) -> str:
    lines: list[str] = []
    for index, result in enumerate(results, start=1):
        content = " ".join(result.content.split())
        if len(content) > 700:
            content = f"{content[:700].rstrip()}..."
        lines.append(
            "\n".join(
                [
                    f"[{index}] {result.title}",
                    f"URL: {result.url}",
                    f"Snippet: {content or 'No snippet provided.'}",
                ]
            )
        )
    return "\n\n".join(lines)


def build_grounded_user_prompt(user_query: str, context: str) -> str:
    return f"""Web context:
{context}

User request:
{user_query}

Answer using the web context above.
Do not include links, raw URLs, numbered citations, or a source section in the answer text.
Write only the answer itself; sources are displayed separately by the application."""
