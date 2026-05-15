from typing import List, Literal, Optional

from pydantic import BaseModel, Field


class SearchRequest(BaseModel):
    query: str = Field(..., min_length=1, max_length=1000)
    limit: Optional[int] = Field(default=None, ge=1, le=10)


class SearchResult(BaseModel):
    title: str
    url: str
    content: str = ""
    engine: Optional[str] = None
    score: Optional[float] = None


class SearchResponse(BaseModel):
    query: str
    results: List[SearchResult]


class ChatMessage(BaseModel):
    role: Literal["system", "user", "assistant"]
    content: str = Field(..., min_length=1)


class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=8000)
    history: List[ChatMessage] = Field(default_factory=list, max_length=30)
    force_search: Optional[bool] = None
    search_limit: Optional[int] = Field(default=None, ge=1, le=10)


class ChatResponse(BaseModel):
    answer: str
    used_search: bool
    search_query: Optional[str] = None
    sources: List[SearchResult] = Field(default_factory=list)
    model: str
