"""Transcript repository for database operations."""

from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.transcript import Transcript


class TranscriptRepository:
    """Repository for Transcript CRUD operations."""

    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def create(
        self,
        video_id: UUID,
        transcript_text: str,
        timestamps: list[dict] | None = None,
        transcript_chunks: list[dict] | None = None,
    ) -> Transcript:
        """Create a new transcript record."""
        transcript = Transcript(
            video_id=video_id,
            transcript_text=transcript_text,
            timestamps=timestamps,
            transcript_chunks=transcript_chunks,
        )
        self.session.add(transcript)
        await self.session.flush()
        await self.session.refresh(transcript)
        return transcript

    async def get_by_video_id(self, video_id: UUID) -> Transcript | None:
        """Get a transcript by its associated video ID."""
        stmt = select(Transcript).where(Transcript.video_id == video_id)
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()
