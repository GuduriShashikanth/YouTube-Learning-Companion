"""Video API endpoints."""

import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_user, get_db
from app.models.user import User
from app.repositories.transcript_repo import TranscriptRepository
from app.schemas.transcript import TranscriptResponse
from app.schemas.video import VideoListResponse, VideoProcessRequest, VideoResponse
from app.services.video_service import VideoService

router = APIRouter()


@router.post(
    "/process",
    response_model=VideoResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Process a YouTube video",
)
async def process_video(
    request: VideoProcessRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> VideoResponse:
    """Process a YouTube video: fetch transcript, store data, create embeddings.

    - Validates the YouTube URL
    - Fetches the transcript from YouTube
    - Stores the video and transcript in the database
    - Creates vector embeddings for RAG
    - Associates the video with the authenticated user
    """
    service = VideoService(db)
    result = await service.process_video(
        youtube_url=request.youtube_url,
        user_id=current_user.id,
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
    current_user: Annotated[User, Depends(get_current_user)],
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
    current_user: Annotated[User, Depends(get_current_user)],
) -> VideoResponse:
    """Get a video by its UUID."""
    service = VideoService(db)
    result = await service.get_video(video_id)
    return VideoResponse.model_validate(result["video"])


@router.get(
    "",
    response_model=VideoListResponse,
    summary="List all videos for the current user",
)
async def list_videos(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
    skip: Annotated[int, Query(ge=0)] = 0,
    limit: Annotated[int, Query(ge=1, le=100)] = 20,
) -> VideoListResponse:
    """List all processed videos for the authenticated user, with pagination."""
    service = VideoService(db)
    result = await service.list_videos(
        user_id=current_user.id,
        skip=skip,
        limit=limit,
    )
    return VideoListResponse(
        videos=[VideoResponse.model_validate(v) for v in result["videos"]],
        total=result["total"],
    )
