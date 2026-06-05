"""Note generation service using LLM."""

from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import TranscriptNotFoundError, VideoNotFoundError
from app.core.logging_config import get_logger
from app.models.note import Note
from app.repositories.note_repo import NoteRepository
from app.repositories.transcript_repo import TranscriptRepository
from app.repositories.video_repo import VideoRepository
from app.services.llm_service import get_llm_service

logger = get_logger(__name__)

NOTES_SYSTEM_PROMPT = """You are an expert educational content creator. Your task is to generate
comprehensive, well-structured study notes from a video transcript. The notes should be
clear, organized, and useful for students reviewing the material."""

NOTES_PROMPT_TEMPLATE = """Based on the following video transcript, create detailed and well-structured
study notes in Markdown format.

Requirements:
- Use ## for main topics/sections
- Use ### for subtopics
- Use bullet points (-) for key points under each topic
- Include a **Key Takeaways** section at the end with the most important points
- Highlight important terms and concepts in **bold**
- Keep the notes concise but comprehensive
- Organize the content logically, even if the transcript jumps between topics
- Include any formulas, definitions, or important data mentioned

Transcript:
{transcript}

Generate the study notes now:"""


class NoteService:
    """Service for generating study notes from video transcripts."""

    def __init__(self, session: AsyncSession) -> None:
        self.session = session
        self.note_repo = NoteRepository(session)
        self.transcript_repo = TranscriptRepository(session)
        self.video_repo = VideoRepository(session)
        self.llm = get_llm_service()

    async def generate_notes(self, video_id: UUID) -> Note:
        """Generate study notes for a video using its transcript.

        Args:
            video_id: The UUID of the video.

        Returns:
            The created Note object.

        Raises:
            VideoNotFoundError: If the video doesn't exist.
            TranscriptNotFoundError: If no transcript is found for the video.
        """
        # Verify video exists
        video = await self.video_repo.get_by_id(video_id)
        if not video:
            raise VideoNotFoundError(f"Video not found: {video_id}")

        # Check for existing notes
        existing_notes = await self.note_repo.get_by_video_id(video_id)
        if existing_notes:
            logger.info(f"Notes already exist for video {video_id}, returning existing.")
            return existing_notes

        # Get transcript
        transcript = await self.transcript_repo.get_by_video_id(video_id)
        if not transcript:
            raise TranscriptNotFoundError(
                f"No transcript found for video: {video_id}"
            )

        logger.info(f"Generating notes for video {video_id}")

        # Truncate transcript if too long to fit in context window
        transcript_text = transcript.transcript_text
        max_chars = 50000  # Conservative limit for most LLMs
        if len(transcript_text) > max_chars:
            transcript_text = transcript_text[:max_chars]
            logger.warning(
                f"Transcript truncated to {max_chars} chars for video {video_id}"
            )

        # Generate notes via LLM
        prompt = NOTES_PROMPT_TEMPLATE.format(transcript=transcript_text)
        generated_notes = await self.llm.generate_structured(
            prompt=prompt,
            system_prompt=NOTES_SYSTEM_PROMPT,
        )

        # Save to DB
        note = await self.note_repo.create(
            video_id=video_id,
            generated_notes=generated_notes,
        )

        logger.info(f"Successfully generated notes for video {video_id}")
        return note

    async def get_notes(self, video_id: UUID) -> Note | None:
        """Get existing notes for a video."""
        return await self.note_repo.get_by_video_id(video_id)
