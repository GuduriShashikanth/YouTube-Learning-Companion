"""Note-related Pydantic schemas."""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class NoteResponse(BaseModel):
    """Schema for note response."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    video_id: UUID
    generated_notes: str
    created_at: datetime
