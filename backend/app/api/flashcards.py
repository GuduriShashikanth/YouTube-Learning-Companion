"""Flashcards API endpoints."""

import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_user, get_db
from app.models.user import User
from app.schemas.flashcard import FlashcardListResponse, FlashcardResponse
from app.services.flashcard_service import FlashcardService

router = APIRouter()


@router.post(
    "/videos/{video_id}/flashcards",
    response_model=FlashcardListResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Generate flashcards",
)
async def generate_flashcards(
    video_id: uuid.UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    _: Annotated[User, Depends(get_current_user)],
) -> FlashcardListResponse:
    """Generate AI-powered flashcards from a video's transcript.

    Creates question-answer pairs for effective study and memorization.
    """
    service = FlashcardService(db)
    flashcards = await service.generate_flashcards(video_id)
    return FlashcardListResponse(
        flashcards=[FlashcardResponse.model_validate(fc) for fc in flashcards],
        total=len(flashcards),
    )


@router.get(
    "/videos/{video_id}/flashcards",
    response_model=FlashcardListResponse,
    summary="Get existing flashcards",
)
async def get_flashcards(
    video_id: uuid.UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    _: Annotated[User, Depends(get_current_user)],
) -> FlashcardListResponse:
    """Get existing flashcards for a video.

    Returns an empty list if no flashcards have been generated yet.
    """
    service = FlashcardService(db)
    flashcards = await service.get_flashcards(video_id)
    return FlashcardListResponse(
        flashcards=[FlashcardResponse.model_validate(fc) for fc in flashcards],
        total=len(flashcards),
    )
