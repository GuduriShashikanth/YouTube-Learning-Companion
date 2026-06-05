"""Chat API endpoints for RAG-based Q&A over video transcripts."""

import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_db
from app.schemas.chat import ChatHistoryItem, ChatRequest, ChatResponse, ChatSource
from app.services.chat_service import ChatService

router = APIRouter()


@router.post(
    "/videos/{video_id}/chat",
    response_model=ChatResponse,
    summary="Ask a question about a video",
)
async def ask_question(
    video_id: uuid.UUID,
    request: ChatRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> ChatResponse:
    """Ask a question about a video using RAG.

    Uses retrieval-augmented generation to find relevant transcript
    sections and generate an answer with source references.
    """
    service = ChatService(db)
    result = await service.ask_question(
        video_id=video_id,
        question=request.question,
    )
    return ChatResponse(
        answer=result["answer"],
        sources=[ChatSource(**s) for s in result["sources"]],
        video_id=result["video_id"],
    )


@router.get(
    "/videos/{video_id}/chat/history",
    response_model=list[ChatHistoryItem],
    summary="Get chat history for a video",
)
async def get_chat_history(
    video_id: uuid.UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    limit: Annotated[int, Query(ge=1, le=200)] = 50,
) -> list[ChatHistoryItem]:
    """Get the chat history for a specific video.

    Returns the conversation history ordered by creation time.
    """
    service = ChatService(db)
    history = await service.get_history(video_id=video_id, limit=limit)

    items = []
    for entry in history:
        # Parse sources from JSON stored in DB
        sources = None
        if entry.sources:
            sources = [ChatSource(**s) for s in entry.sources]

        items.append(
            ChatHistoryItem(
                id=entry.id,
                user_question=entry.user_question,
                ai_response=entry.ai_response,
                sources=sources,
                created_at=entry.created_at,
            )
        )

    return items
