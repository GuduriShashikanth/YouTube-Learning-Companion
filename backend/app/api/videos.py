"""Video API endpoints."""

import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_db
from app.models.user import User
from app.repositories.transcript_repo import TranscriptRepository
from app.schemas.transcript import TranscriptResponse
from app.schemas.video import VideoListResponse, VideoProcessRequest, VideoResponse
from app.services.video_service import VideoService

router = APIRouter()

# Default user ID for simplified auth (no real auth system yet)
DEFAULT_USER_ID = uuid.UUID("00000000-0000-0000-0000-000000000001")
DEFAULT_USER_EMAIL = "default@learntube.app"


async def ensure_default_user(session: AsyncSession) -> None:
    """Create the default user if it doesn't already exist."""
    result = await session.execute(select(User).where(User.id == DEFAULT_USER_ID))
    if not result.scalar_one_or_none():
        session.add(User(id=DEFAULT_USER_ID, email=DEFAULT_USER_EMAIL))
        await session.flush()


@router.post(
    "/process",
    response_model=VideoResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Process a YouTube video",
)
async def process_video(
    request: VideoProcessRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> VideoResponse:
    """Process a YouTube video: fetch transcript, store data, create embeddings.

    - Validates the YouTube URL
    - Fetches the transcript from YouTube
    - Stores the video and transcript in the database
    - Creates vector embeddings for RAG
    """
    await ensure_default_user(db)
    service = VideoService(db)
    result = await service.process_video(
        youtube_url=request.youtube_url,
        user_id=DEFAULT_USER_ID,
    )
    return VideoResponse.model_validate(result["video"])


@router.get(
    "/{video_id}/transcript",
    response_model=TranscriptResponse,
    summary="Get transcript for a video",
)
async def get_transcript(
    video_id: uuid.UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> TranscriptResponse:
    """Get the full transcript (text + timestamps) for a video."""
    repo = TranscriptRepository(db)
    transcript = await repo.get_by_video_id(video_id)
    if not transcript:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No transcript found for video {video_id}.",
        )
    return TranscriptResponse.model_validate(transcript)


@router.get(
    "/{video_id}",
    response_model=VideoResponse,
    summary="Get a video by ID",
)
async def get_video(
    video_id: uuid.UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> VideoResponse:
    """Get a video by its UUID."""
    service = VideoService(db)
    result = await service.get_video(video_id)
    return VideoResponse.model_validate(result["video"])


@router.get(
    "",
    response_model=VideoListResponse,
    summary="List all videos",
)
async def list_videos(
    db: Annotated[AsyncSession, Depends(get_db)],
    skip: Annotated[int, Query(ge=0)] = 0,
    limit: Annotated[int, Query(ge=1, le=100)] = 20,
) -> VideoListResponse:
    """List all processed videos with pagination."""
    service = VideoService(db)
    result = await service.list_videos(
        user_id=DEFAULT_USER_ID,
        skip=skip,
        limit=limit,
    )
    return VideoListResponse(
        videos=[VideoResponse.model_validate(v) for v in result["videos"]],
        total=result["total"],
    )

