"""Flashcard repository for database operations."""

from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.flashcard import Flashcard


class FlashcardRepository:
    """Repository for Flashcard CRUD operations."""

    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def create_bulk(
        self, video_id: UUID, flashcards: list[dict]
    ) -> list[Flashcard]:
        """Create multiple flashcard records at once."""
        flashcard_objects = []
        for fc_data in flashcards:
            flashcard = Flashcard(
                video_id=video_id,
                question=fc_data["question"],
                answer=fc_data["answer"],
            )
            self.session.add(flashcard)
            flashcard_objects.append(flashcard)

        await self.session.flush()

        # Refresh all objects to get generated fields
        for fc in flashcard_objects:
            await self.session.refresh(fc)

        return flashcard_objects

    async def get_by_video_id(self, video_id: UUID) -> list[Flashcard]:
        """Get all flashcards for a given video."""
        stmt = (
            select(Flashcard)
            .where(Flashcard.video_id == video_id)
            .order_by(Flashcard.created_at)
        )
        result = await self.session.execute(stmt)
        return list(result.scalars().all())
