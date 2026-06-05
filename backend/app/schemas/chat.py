"""Chat-related Pydantic schemas."""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class ChatRequest(BaseModel):
    """Schema for chat question request."""

    question: str


class ChatSource(BaseModel):
    """Schema for a source reference in a chat response."""

    text: str
    start_time: float | None = None
    end_time: float | None = None


class ChatResponse(BaseModel):
    """Schema for chat answer response."""

    answer: str
    sources: list[ChatSource]
    video_id: UUID


class ChatHistoryItem(BaseModel):
    """Schema for a single chat history entry."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_question: str
    ai_response: str
    sources: list[ChatSource] | None = None
    created_at: datetime
