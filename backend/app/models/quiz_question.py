"""QuizQuestion model."""

from __future__ import annotations

import uuid
from typing import TYPE_CHECKING

from sqlalchemy import ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin

if TYPE_CHECKING:
    from app.models.quiz import Quiz


class QuizQuestion(TimestampMixin, Base):
    """A single multiple-choice question belonging to a quiz."""

    __tablename__ = "quiz_questions"

    quiz_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("quizzes.id", ondelete="CASCADE"),
    )
    question: Mapped[str] = mapped_column(Text)
    option_a: Mapped[str] = mapped_column(String(500))
    option_b: Mapped[str] = mapped_column(String(500))
    option_c: Mapped[str] = mapped_column(String(500))
    option_d: Mapped[str] = mapped_column(String(500))
    correct_answer: Mapped[str] = mapped_column(String(1))  # 'a', 'b', 'c', or 'd'
    explanation: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Relationships
    quiz: Mapped[Quiz] = relationship("Quiz", back_populates="questions", lazy="selectin")

    def __repr__(self) -> str:
        return f"<QuizQuestion id={self.id} quiz_id={self.quiz_id}>"
