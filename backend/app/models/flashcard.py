"""Flashcard model."""

from __future__ import annotations

import uuid
from typing import TYPE_CHECKING

from sqlalchemy import ForeignKey, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin

if TYPE_CHECKING:
    from app.models.video import Video


class Flashcard(TimestampMixin, Base):
    """A single Q&A flashcard generated from video content."""

    __tablename__ = "flashcards"

    video_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("videos.id", ondelete="CASCADE"),
    )
    question: Mapped[str] = mapped_column(Text)
    answer: Mapped[str] = mapped_column(Text)

    # Relationships
    video: Mapped[Video] = relationship("Video", back_populates="flashcards", lazy="selectin")

    def __repr__(self) -> str:
        return f"<Flashcard id={self.id} video_id={self.video_id}>"
