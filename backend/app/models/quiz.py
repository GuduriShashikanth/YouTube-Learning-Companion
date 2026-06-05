"""Quiz model."""

from __future__ import annotations

import uuid
from typing import TYPE_CHECKING

from sqlalchemy import ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin

if TYPE_CHECKING:
    from app.models.quiz_question import QuizQuestion
    from app.models.video import Video


class Quiz(TimestampMixin, Base):
    """A quiz generated from video content, containing multiple questions."""

    __tablename__ = "quizzes"

    video_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("videos.id", ondelete="CASCADE"),
    )

    # Relationships
    video: Mapped[Video] = relationship("Video", back_populates="quizzes", lazy="selectin")
    questions: Mapped[list[QuizQuestion]] = relationship(
        "QuizQuestion",
        back_populates="quiz",
        cascade="all, delete-orphan",
        lazy="selectin",
    )

    def __repr__(self) -> str:
        return f"<Quiz id={self.id} video_id={self.video_id}>"
