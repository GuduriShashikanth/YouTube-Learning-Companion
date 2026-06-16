"""Video repository for database operations."""

from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.video import Video


class VideoRepository:
    """Repository for Video CRUD operations."""

    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def create(
        self,
        user_id: UUID,
        youtube_url: str,
        youtube_video_id: str,
        title: str | None = None,
    ) -> Video:
        """Create a new video record."""
        video = Video(
            user_id=user_id,
            youtube_url=youtube_url,
            youtube_video_id=youtube_video_id,
            title=title,
        )
        self.session.add(video)
        await self.session.flush()
        await self.session.refresh(video)
        return video

    async def get_by_id(self, video_id: UUID) -> Video | None:
        """Get a video by its primary key ID."""
        stmt = select(Video).where(Video.id == video_id)
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def get_by_user_and_youtube_id(
        self, user_id: UUID, youtube_video_id: str
    ) -> Video | None:
        """Get a video by its YouTube video ID for a specific user."""
        stmt = select(Video).where(
            Video.user_id == user_id,
            Video.youtube_video_id == youtube_video_id
        )
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def get_by_youtube_id(self, youtube_video_id: str) -> list[Video]:
        """Get all video records for a YouTube video ID."""
        stmt = select(Video).where(Video.youtube_video_id == youtube_video_id)
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def list_by_user(
        self, user_id: UUID, skip: int = 0, limit: int = 20
    ) -> tuple[list[Video], int]:
        """List videos for a user with pagination. Returns (videos, total_count)."""
        # Get total count
        count_stmt = select(func.count()).select_from(Video).where(Video.user_id == user_id)
        count_result = await self.session.execute(count_stmt)
        total = count_result.scalar_one()

        # Get paginated results
        stmt = (
            select(Video)
            .where(Video.user_id == user_id)
            .order_by(Video.created_at.desc())
            .offset(skip)
            .limit(limit)
        )
        result = await self.session.execute(stmt)
        videos = list(result.scalars().all())

        return videos, total
