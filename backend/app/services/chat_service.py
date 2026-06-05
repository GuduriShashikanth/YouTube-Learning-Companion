"""Chat service for RAG-based question answering over video transcripts."""

from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import VideoNotFoundError
from app.core.logging_config import get_logger
from app.rag.pipeline import RAGPipeline
from app.repositories.chat_repo import ChatRepository
from app.repositories.video_repo import VideoRepository

logger = get_logger(__name__)


class ChatService:
    """Service for answering questions about videos using RAG."""

    def __init__(self, session: AsyncSession) -> None:
        self.session = session
        self.chat_repo = ChatRepository(session)
        self.video_repo = VideoRepository(session)
        self.rag_pipeline = RAGPipeline()

    async def ask_question(self, video_id: UUID, question: str) -> dict:
        """Answer a question about a video using RAG.

        Args:
            video_id: The UUID of the video to query.
            question: The user's question.

        Returns:
            A dict with answer, sources, and video_id.

        Raises:
            VideoNotFoundError: If the video doesn't exist.
        """
        # Verify video exists
        video = await self.video_repo.get_by_id(video_id)
        if not video:
            raise VideoNotFoundError(f"Video not found: {video_id}")

        logger.info(f"Answering question for video {video_id}: {question[:100]}...")

        # Use RAG pipeline to get answer and sources
        answer, sources = await self.rag_pipeline.answer_question(
            video_id=str(video_id),
            question=question,
        )

        # Format sources for storage and response
        source_dicts = [
            {
                "text": s.get("text", ""),
                "start_time": s.get("start_time"),
                "end_time": s.get("end_time"),
            }
            for s in sources
        ]

        # Save to chat history
        chat_entry = await self.chat_repo.create(
            video_id=video_id,
            user_question=question,
            ai_response=answer,
            sources=source_dicts,
        )

        logger.info(f"Successfully answered question for video {video_id}")

        return {
            "answer": answer,
            "sources": source_dicts,
            "video_id": video_id,
        }

    async def get_history(self, video_id: UUID, limit: int = 50) -> list:
        """Get chat history for a video.

        Args:
            video_id: The UUID of the video.
            limit: Maximum number of history entries to return.

        Returns:
            List of ChatHistory objects.
        """
        return await self.chat_repo.get_history_by_video(
            video_id=video_id, limit=limit
        )
