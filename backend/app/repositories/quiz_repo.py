"""Quiz repository for database operations."""

from uuid import UUID

from sqlalchemy import delete, select
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

    async def delete_by_video_id(self, video_id: UUID) -> None:
        """Delete all quizzes (and their questions) for a video.

        Uses bulk DELETE SQL to bypass the ORM identity map, then calls
        expire_all() so subsequent queries within the same transaction
        hit the DB fresh rather than returning stale cached objects.
        """
        # First get the quiz IDs for this video
        quiz_ids_result = await self.session.execute(
            select(Quiz.id).where(Quiz.video_id == video_id)
        )
        quiz_ids = [row[0] for row in quiz_ids_result]

        if quiz_ids:
            # Bulk-delete questions then quizzes (respects FK order)
            await self.session.execute(
                delete(QuizQuestion).where(QuizQuestion.quiz_id.in_(quiz_ids))
            )
            await self.session.execute(
                delete(Quiz).where(Quiz.id.in_(quiz_ids))
            )
            await self.session.flush()

        # Bust the identity map so the next read is fresh
        self.session.expire_all()
