"""Flashcard-related Pydantic schemas."""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class FlashcardResponse(BaseModel):
    """Schema for a single flashcard response."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    video_id: UUID
    question: str
    answer: str
    created_at: datetime


class FlashcardListResponse(BaseModel):
    """Schema for paginated flashcard list response."""

    flashcards: list[FlashcardResponse]
    total: int
