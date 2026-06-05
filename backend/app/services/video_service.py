"""Video processing service — orchestrates video ingestion pipeline."""

from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import (
    InvalidYouTubeURLError,
    TranscriptFetchError,
    VideoNotFoundError,
)
from app.core.logging_config import get_logger
from app.rag.chunker import chunk_transcript
from app.rag.vector_store import VectorStoreManager
from app.repositories.transcript_repo import TranscriptRepository
from app.repositories.video_repo import VideoRepository
from app.services.transcript_service import TranscriptService
from app.utils.youtube import extract_video_id

logger = get_logger(__name__)


class VideoService:
    """Service for processing and managing YouTube videos."""

    def __init__(self, session: AsyncSession) -> None:
        self.session = session
        self.video_repo = VideoRepository(session)
        self.transcript_repo = TranscriptRepository(session)
        self.transcript_service = TranscriptService()
        self.vector_store = VectorStoreManager()

    async def process_video(self, youtube_url: str, user_id: UUID) -> dict:
        """Process a YouTube video: fetch transcript, store data, create embeddings.

        Args:
            youtube_url: The full YouTube video URL.
            user_id: The ID of the user processing the video.

        Returns:
            A dict with video data and processing status.

        Raises:
            InvalidYouTubeURLError: If the URL is not a valid YouTube URL.
            TranscriptFetchError: If the transcript cannot be fetched.
        """
        # 1. Extract and validate the YouTube video ID
        video_id_str = extract_video_id(youtube_url)
        if not video_id_str:
            raise InvalidYouTubeURLError(
                "Could not extract video ID from the provided URL."
            )

        logger.info(f"Processing video: {video_id_str} for user: {user_id}")

        # 2. Check if the video already exists
        existing_video = await self.video_repo.get_by_youtube_id(video_id_str)
        if existing_video:
            logger.info(f"Video {video_id_str} already exists in database.")
            existing_transcript = await self.transcript_repo.get_by_video_id(
                existing_video.id
            )
            return {
                "video": existing_video,
                "transcript_preview": (
                    existing_transcript.transcript_text[:500]
                    if existing_transcript
                    else None
                ),
                "already_exists": True,
            }

        # 3. Fetch transcript from YouTube
        full_text, timestamps = await self.transcript_service.fetch_transcript(
            video_id_str
        )

        # 4. Create Video record
        video = await self.video_repo.create(
            user_id=user_id,
            youtube_url=youtube_url,
            youtube_video_id=video_id_str,
            title=None,  # Title could be fetched separately if needed
        )

        # 5. Create Transcript record
        transcript = await self.transcript_repo.create(
            video_id=video.id,
            transcript_text=full_text,
            timestamps=timestamps,
        )

        # 6. Chunk transcript and store embeddings in ChromaDB
        try:
            documents = chunk_transcript(full_text, timestamps)
            await self.vector_store.add_documents(
                video_id=str(video.id), documents=documents
            )
            logger.info(
                f"Stored {len(documents)} chunks in vector store for video {video.id}"
            )
        except Exception as e:
            logger.error(f"Failed to store embeddings for video {video.id}: {e}")
            # Don't fail the whole operation if embedding storage fails
            # The video and transcript are still saved

        return {
            "video": video,
            "transcript_preview": full_text[:500],
            "already_exists": False,
        }

    async def get_video(self, video_id: UUID) -> dict:
        """Get a video by ID.

        Raises:
            VideoNotFoundError: If the video is not found.
        """
        video = await self.video_repo.get_by_id(video_id)
        if not video:
            raise VideoNotFoundError(f"Video not found: {video_id}")
        return {"video": video}

    async def list_videos(
        self, user_id: UUID, skip: int = 0, limit: int = 20
    ) -> dict:
        """List videos for a user with pagination."""
        videos, total = await self.video_repo.list_by_user(
            user_id=user_id, skip=skip, limit=limit
        )
        return {"videos": videos, "total": total}
