"""Quiz repository for database operations."""

from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.quiz import Quiz
from app.models.quiz_question import QuizQuestion


class QuizRepository:
    """Repository for Quiz CRUD operations."""

    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def create_with_questions(
        self, video_id: UUID, questions: list[dict]
    ) -> Quiz:
        """Create a quiz with its associated questions."""
        quiz = Quiz(video_id=video_id)
        self.session.add(quiz)
        await self.session.flush()
        await self.session.refresh(quiz)

        for q_data in questions:
            question = QuizQuestion(
                quiz_id=quiz.id,
                question=q_data["question"],
                option_a=q_data["option_a"],
                option_b=q_data["option_b"],
                option_c=q_data["option_c"],
                option_d=q_data["option_d"],
                correct_answer=q_data["correct_answer"],
                explanation=q_data.get("explanation"),
            )
            self.session.add(question)

        await self.session.flush()

        # Re-fetch with eagerly loaded questions
        stmt = (
            select(Quiz)
            .options(selectinload(Quiz.questions))
            .where(Quiz.id == quiz.id)
        )
        result = await self.session.execute(stmt)
        return result.scalar_one()

    async def get_by_video_id(self, video_id: UUID) -> Quiz | None:
        """Get a quiz by video ID with eagerly loaded questions."""
        stmt = (
            select(Quiz)
            .options(selectinload(Quiz.questions))
            .where(Quiz.video_id == video_id)
            .order_by(Quiz.created_at.desc())
        )
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()
