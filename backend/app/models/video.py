"""Video model."""

from __future__ import annotations

import uuid
from typing import TYPE_CHECKING

from sqlalchemy import ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin

if TYPE_CHECKING:
    from app.models.chat_history import ChatHistory
    from app.models.flashcard import Flashcard
    from app.models.note import Note
    from app.models.quiz import Quiz
    from app.models.transcript import Transcript
    from app.models.user import User


class Video(TimestampMixin, Base):
    """A YouTube video added by a user."""

    __tablename__ = "videos"

    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
    )
    youtube_url: Mapped[str] = mapped_column(String(500))
    youtube_video_id: Mapped[str] = mapped_column(String(50), index=True)
    title: Mapped[str | None] = mapped_column(String(500))

    # Relationships
    user: Mapped[User] = relationship("User", back_populates="videos", lazy="selectin")
    transcript: Mapped[Transcript | None] = relationship(
        "Transcript",
        back_populates="video",
        uselist=False,
        cascade="all, delete-orphan",
        lazy="selectin",
    )
    notes: Mapped[list[Note]] = relationship(
        "Note",
        back_populates="video",
        cascade="all, delete-orphan",
        lazy="selectin",
    )
    flashcards: Mapped[list[Flashcard]] = relationship(
        "Flashcard",
        back_populates="video",
        cascade="all, delete-orphan",
        lazy="selectin",
    )
    quizzes: Mapped[list[Quiz]] = relationship(
        "Quiz",
        back_populates="video",
        cascade="all, delete-orphan",
        lazy="selectin",
    )
    chat_histories: Mapped[list[ChatHistory]] = relationship(
        "ChatHistory",
        back_populates="video",
        cascade="all, delete-orphan",
        lazy="selectin",
    )

    def __repr__(self) -> str:
        return f"<Video id={self.id} youtube_video_id={self.youtube_video_id!r}>"
