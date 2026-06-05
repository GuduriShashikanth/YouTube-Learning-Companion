"""Chat history repository for database operations."""

from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.chat_history import ChatHistory


class ChatRepository:
    """Repository for ChatHistory CRUD operations."""

    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def create(
        self,
        video_id: UUID,
        user_question: str,
        ai_response: str,
        sources: list[dict] | None = None,
    ) -> ChatHistory:
        """Create a new chat history entry."""
        chat = ChatHistory(
            video_id=video_id,
            user_question=user_question,
            ai_response=ai_response,
            sources=sources,
        )
        self.session.add(chat)
        await self.session.flush()
        await self.session.refresh(chat)
        return chat

    async def get_history_by_video(
        self, video_id: UUID, limit: int = 50
    ) -> list[ChatHistory]:
        """Get chat history for a video, ordered by creation time."""
        stmt = (
            select(ChatHistory)
            .where(ChatHistory.video_id == video_id)
            .order_by(ChatHistory.created_at.asc())
            .limit(limit)
        )
        result = await self.session.execute(stmt)
        return list(result.scalars().all())
