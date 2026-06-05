"""Transcript model."""

from __future__ import annotations

import uuid
from typing import TYPE_CHECKING

from sqlalchemy import ForeignKey, JSON, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin

if TYPE_CHECKING:
    from app.models.video import Video


class Transcript(TimestampMixin, Base):
    """Stored transcript for a video, including chunked text and timestamps."""

    __tablename__ = "transcripts"

    video_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("videos.id", ondelete="CASCADE"),
        unique=True,
    )
    transcript_text: Mapped[str] = mapped_column(Text)
    transcript_chunks: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    timestamps: Mapped[list | None] = mapped_column(JSON, nullable=True)

    # Relationships
    video: Mapped[Video] = relationship("Video", back_populates="transcript", lazy="selectin")

    def __repr__(self) -> str:
        return f"<Transcript id={self.id} video_id={self.video_id}>"
