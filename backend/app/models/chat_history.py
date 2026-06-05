"""ChatHistory model."""

from __future__ import annotations

import uuid
from typing import TYPE_CHECKING

from sqlalchemy import ForeignKey, JSON, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin

if TYPE_CHECKING:
    from app.models.video import Video


class ChatHistory(TimestampMixin, Base):
    """A single chat exchange (question + AI response) for a video."""

    __tablename__ = "chat_history"

    video_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("videos.id", ondelete="CASCADE"),
    )
    user_question: Mapped[str] = mapped_column(Text)
    ai_response: Mapped[str] = mapped_column(Text)
    sources: Mapped[list | None] = mapped_column(JSON, nullable=True)

    # Relationships
    video: Mapped[Video] = relationship("Video", back_populates="chat_histories", lazy="selectin")

    def __repr__(self) -> str:
        return f"<ChatHistory id={self.id} video_id={self.video_id}>"
