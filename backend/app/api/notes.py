"""Notes API endpoints."""

import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_db
from app.schemas.note import NoteResponse
from app.services.note_service import NoteService

router = APIRouter()


@router.post(
    "/videos/{video_id}/notes",
    response_model=NoteResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Generate study notes",
)
async def generate_notes(
    video_id: uuid.UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> NoteResponse:
    """Generate AI-powered study notes from a video's transcript.

    Creates structured markdown notes with main topics, subtopics,
    key points, and takeaways.
    """
    service = NoteService(db)
    note = await service.generate_notes(video_id)
    return NoteResponse.model_validate(note)


@router.get(
    "/videos/{video_id}/notes",
    response_model=NoteResponse,
    summary="Get existing notes",
)
async def get_notes(
    video_id: uuid.UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> NoteResponse:
    """Get existing study notes for a video.

    Returns 404 if no notes have been generated yet.
    """
    service = NoteService(db)
    note = await service.get_notes(video_id)
    if not note:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No notes found for video {video_id}. Generate them first using POST.",
        )
    return NoteResponse.model_validate(note)
