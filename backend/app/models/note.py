"""Note model."""

from __future__ import annotations

import uuid
from typing import TYPE_CHECKING

from sqlalchemy import ForeignKey, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin

if TYPE_CHECKING:
    from app.models.video import Video


class Note(TimestampMixin, Base):
    """AI-generated notes for a video."""

    __tablename__ = "notes"

    video_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("videos.id", ondelete="CASCADE"),
    )
    generated_notes: Mapped[str] = mapped_column(Text)

    # Relationships
    video: Mapped[Video] = relationship("Video", back_populates="notes", lazy="selectin")

    def __repr__(self) -> str:
        return f"<Note id={self.id} video_id={self.video_id}>"
