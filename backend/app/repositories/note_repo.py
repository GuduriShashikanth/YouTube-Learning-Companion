"""Note repository for database operations."""

from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.note import Note


class NoteRepository:
    """Repository for Note CRUD operations."""

    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def create(self, video_id: UUID, generated_notes: str) -> Note:
        """Create a new note record."""
        note = Note(
            video_id=video_id,
            generated_notes=generated_notes,
        )
        self.session.add(note)
        await self.session.flush()
        await self.session.refresh(note)
        return note

    async def get_by_video_id(self, video_id: UUID) -> Note | None:
        """Get notes by the associated video ID."""
        stmt = select(Note).where(Note.video_id == video_id)
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()
