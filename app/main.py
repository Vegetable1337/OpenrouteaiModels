import logging
from typing import List

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.llm import OpenRouterClient
from app.models import ChatMessage, ChatRequest, ChatResponse, SearchRequest, SearchResponse
from app.prompts import SYSTEM_PROMPT, build_grounded_user_prompt, build_search_context
from app.search import SearchClient, needs_web_search


settings = get_settings()
logging.basicConfig(
    level=getattr(logging, settings.log_level.upper(), logging.INFO),
    format="%(asctime)s %(levelname)s %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)

app = FastAPI(title=settings.app_name, version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

search_client = SearchClient(settings)
llm_client = OpenRouterClient(settings)


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/search", response_model=SearchResponse)
async def search(request: SearchRequest) -> SearchResponse:
    logger.info("Search request: %s", request.query)
    results = await search_client.search(request.query, request.limit)
    return SearchResponse(query=request.query, results=results)


@app.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest) -> ChatResponse:
    should_search = request.force_search if request.force_search is not None else needs_web_search(request.message)
    sources = []
    search_query = None
    user_prompt = request.message

    if should_search:
        search_query = await llm_client.build_search_query(request.message)
        logger.info("Auto web search enabled. Query: %s", search_query)
        sources = await search_client.search(search_query, request.search_limit)
        if sources:
            user_prompt = build_grounded_user_prompt(request.message, build_search_context(sources))

    messages: List[ChatMessage] = [ChatMessage(role="system", content=SYSTEM_PROMPT)]
    messages.extend(request.history[-20:])
    messages.append(ChatMessage(role="user", content=user_prompt))

    answer = await llm_client.complete(messages)
    return ChatResponse(
        answer=answer,
        used_search=bool(should_search and sources),
        search_query=search_query,
        sources=sources,
        model=settings.openrouter_model,
    )
