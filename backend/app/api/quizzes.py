"""Quiz API endpoints."""

import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_user, get_db
from app.models.user import User
from app.schemas.quiz import QuizResponse
from app.services.quiz_service import QuizService

router = APIRouter()


@router.post(
    "/videos/{video_id}/quiz",
    response_model=QuizResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Generate a quiz",
)
async def generate_quiz(
    video_id: uuid.UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    _: Annotated[User, Depends(get_current_user)],
    force: bool = Query(
        default=False,
        description="If true, delete the existing quiz and generate a fresh one.",
    ),
) -> QuizResponse:
    """Generate an AI-powered multiple-choice quiz from a video's transcript.

    Creates 10 MCQ questions with options, correct answers, and explanations.
    Pass ?force=true to regenerate a fresh quiz even if one already exists.
    """
    service = QuizService(db)
    quiz = await service.generate_quiz(video_id, force=force)
    return QuizResponse.model_validate(quiz)


@router.get(
    "/videos/{video_id}/quiz",
    response_model=QuizResponse,
    summary="Get existing quiz",
)
async def get_quiz(
    video_id: uuid.UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    _: Annotated[User, Depends(get_current_user)],
) -> QuizResponse:
    """Get an existing quiz for a video.

    Returns 404 if no quiz has been generated yet.
    """
    service = QuizService(db)
    quiz = await service.get_quiz(video_id)
    if not quiz:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No quiz found for video {video_id}. Generate one first using POST.",
        )
    return QuizResponse.model_validate(quiz)
