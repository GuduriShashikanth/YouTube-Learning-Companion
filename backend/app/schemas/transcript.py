"""Transcript-related Pydantic schemas."""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class TranscriptChunk(BaseModel):
    """Schema for a single transcript chunk with timing info."""

    text: str
    start: float
    duration: float


class TranscriptResponse(BaseModel):
    """Schema for transcript response."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    video_id: UUID
    transcript_text: str
    timestamps: list[TranscriptChunk] | None = None
    created_at: datetime
