"""Notes API endpoints."""

import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_user, get_db
from app.models.user import User
from app.schemas.note import NoteResponse
from app.services.note_service import NoteService
from app.repositories.video_repo import VideoRepository
from app.utils.pdf_generator import generate_pdf_from_markdown

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
    _: Annotated[User, Depends(get_current_user)],
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
    _: Annotated[User, Depends(get_current_user)],
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


@router.get(
    "/videos/{video_id}/notes/export/pdf",
    summary="Export notes to PDF format",
)
async def export_notes_pdf(
    video_id: uuid.UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    _: Annotated[User, Depends(get_current_user)],
):
    """Export the generated study notes for a video as a styled PDF guide."""
    video_repo = VideoRepository(db)
    video = await video_repo.get_by_id(video_id)
    if not video:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Video not found.",
        )

    service = NoteService(db)
    notes = await service.get_notes(video_id)
    if not notes:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No notes found for this video. Generate them first.",
        )

    pdf_title = video.title or f"Study Guide - {video.youtube_video_id}"
    pdf_buffer = generate_pdf_from_markdown(pdf_title, notes.generated_notes)

    safe_title = "".join(c for c in pdf_title if c.isalnum() or c in "._- ").strip()
    safe_title = safe_title[:50] or "notes"

    return StreamingResponse(
        pdf_buffer,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="{safe_title}.pdf"'
        },
    )
