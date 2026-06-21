"""Flashcards API endpoints."""

import io
import csv
import os
import tempfile
import uuid
from typing import Annotated
import genanki

from fastapi import APIRouter, Depends, status, HTTPException, BackgroundTasks
from fastapi.responses import StreamingResponse, FileResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_user, get_db
from app.models.user import User
from app.schemas.flashcard import FlashcardListResponse, FlashcardResponse
from app.services.flashcard_service import FlashcardService
from app.repositories.video_repo import VideoRepository

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


@router.get(
    "/videos/{video_id}/flashcards/export/csv",
    summary="Export flashcards to Anki CSV format",
)
async def export_flashcards_csv(
    video_id: uuid.UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    _: Annotated[User, Depends(get_current_user)],
):
    """Export all generated flashcards for a video as a standard Anki-compatible CSV file."""
    service = FlashcardService(db)
    flashcards = await service.get_flashcards(video_id)
    if not flashcards:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No flashcards found for this video. Generate them first.",
        )

    output = io.StringIO()
    writer = csv.writer(output, delimiter=',', quotechar='"', quoting=csv.QUOTE_MINIMAL)
    for fc in flashcards:
        writer.writerow([fc.question, fc.answer])

    output.seek(0)
    
    return StreamingResponse(
        io.BytesIO(output.getvalue().encode("utf-8")),
        media_type="text/csv",
        headers={
            "Content-Disposition": f'attachment; filename="flashcards-{video_id}.csv"'
        },
    )


@router.get(
    "/videos/{video_id}/flashcards/export/apkg",
    summary="Export flashcards to Anki .apkg format",
)
async def export_flashcards_apkg(
    video_id: uuid.UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    _: Annotated[User, Depends(get_current_user)],
    background_tasks: BackgroundTasks,
):
    """Export all generated flashcards for a video directly to a standard Anki .apkg deck file."""
    video_repo = VideoRepository(db)
    video = await video_repo.get_by_id(video_id)
    if not video:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Video not found.",
        )

    service = FlashcardService(db)
    flashcards = await service.get_flashcards(video_id)
    if not flashcards:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No flashcards found for this video. Generate them first.",
        )

    deck_id = hash(str(video_id)) % (10**10)
    model_id = (deck_id + 1) % (10**10)
    
    deck_name = video.title or f"Flashcards - {video.youtube_video_id}"
    
    my_model = genanki.Model(
        model_id,
        'Simple Model',
        fields=[
            {'name': 'Question'},
            {'name': 'Answer'},
        ],
        templates=[
            {
                'name': 'Card 1',
                'qfmt': '{{Question}}',
                'afmt': '{{FrontSide}}<hr id="answer">{{Answer}}',
            },
        ]
    )
    
    my_deck = genanki.Deck(deck_id, deck_name)
    
    for fc in flashcards:
        my_note = genanki.Note(
            model=my_model,
            fields=[fc.question, fc.answer]
        )
        my_deck.add_note(my_note)
        
    temp_dir = tempfile.gettempdir()
    temp_filename = f"deck-{video_id}.apkg"
    temp_path = os.path.join(temp_dir, temp_filename)
    
    my_deck.write_to_file(temp_path)
    
    def cleanup():
        if os.path.exists(temp_path):
            os.remove(temp_path)
            
    background_tasks.add_task(cleanup)
    
    safe_title = "".join(c for c in (video.title or "flashcards") if c.isalnum() or c in "._- ").strip()
    safe_title = safe_title[:50] or "flashcards"
    
    return FileResponse(
        temp_path,
        media_type="application/octet-stream",
        filename=f"{safe_title}.apkg",
        background=background_tasks
    )
