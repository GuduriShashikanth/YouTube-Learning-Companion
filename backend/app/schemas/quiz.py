"""Quiz-related Pydantic schemas."""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class QuizQuestionResponse(BaseModel):
    """Schema for a single quiz question response."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    question: str
    option_a: str
    option_b: str
    option_c: str
    option_d: str
    correct_answer: str
    explanation: str | None = None


class QuizResponse(BaseModel):
    """Schema for quiz response with all questions."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    video_id: UUID
    questions: list[QuizQuestionResponse]
    created_at: datetime
