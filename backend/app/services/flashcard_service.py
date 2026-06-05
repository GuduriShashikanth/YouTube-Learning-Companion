"""Flashcard generation service using LLM."""

import json
import re
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import (
    LLMGenerationError,
    TranscriptNotFoundError,
    VideoNotFoundError,
)
from app.core.logging_config import get_logger
from app.models.flashcard import Flashcard
from app.repositories.flashcard_repo import FlashcardRepository
from app.repositories.transcript_repo import TranscriptRepository
from app.repositories.video_repo import VideoRepository
from app.services.llm_service import get_llm_service

logger = get_logger(__name__)

FLASHCARD_SYSTEM_PROMPT = """You are an expert educational content creator specializing in creating
effective flashcards for learning and memorization. You create clear, concise question-answer pairs
that test understanding of key concepts."""

FLASHCARD_PROMPT_TEMPLATE = """Based on the following video transcript, create exactly 20 flashcards
for studying the material. Each flashcard should have a clear question and a concise, accurate answer.

Requirements:
- Create exactly 20 flashcards
- Cover the main concepts, definitions, and key facts from the transcript
- Questions should test understanding, not just recall
- Answers should be concise but complete
- Vary the types of questions (definition, explanation, comparison, application)
- Return ONLY a valid JSON array, no other text

Return the flashcards in this exact JSON format:
[
    {{"question": "What is...?", "answer": "It is..."}},
    {{"question": "How does...?", "answer": "It works by..."}}
]

Transcript:
{transcript}

Generate exactly 20 flashcards as a JSON array:"""


def _parse_flashcards_json(response: str) -> list[dict]:
    """Parse the LLM response to extract flashcard JSON.

    Handles cases where the LLM wraps JSON in markdown code blocks.
    """
    # Try to find JSON array in the response
    # First, try direct parsing
    try:
        return json.loads(response)
    except json.JSONDecodeError:
        pass

    # Try to extract from markdown code block
    json_match = re.search(r"```(?:json)?\s*\n?(.*?)\n?```", response, re.DOTALL)
    if json_match:
        try:
            return json.loads(json_match.group(1))
        except json.JSONDecodeError:
            pass

    # Try to find array brackets
    bracket_match = re.search(r"\[.*\]", response, re.DOTALL)
    if bracket_match:
        try:
            return json.loads(bracket_match.group(0))
        except json.JSONDecodeError:
            pass

    raise ValueError("Could not parse flashcards JSON from LLM response")


class FlashcardService:
    """Service for generating flashcards from video transcripts."""

    def __init__(self, session: AsyncSession) -> None:
        self.session = session
        self.flashcard_repo = FlashcardRepository(session)
        self.transcript_repo = TranscriptRepository(session)
        self.video_repo = VideoRepository(session)
        self.llm = get_llm_service()

    async def generate_flashcards(self, video_id: UUID) -> list[Flashcard]:
        """Generate flashcards for a video using its transcript.

        Args:
            video_id: The UUID of the video.

        Returns:
            List of created Flashcard objects.

        Raises:
            VideoNotFoundError: If the video doesn't exist.
            TranscriptNotFoundError: If no transcript is found.
            LLMGenerationError: If the LLM response can't be parsed.
        """
        # Verify video exists
        video = await self.video_repo.get_by_id(video_id)
        if not video:
            raise VideoNotFoundError(f"Video not found: {video_id}")

        # Check for existing flashcards
        existing = await self.flashcard_repo.get_by_video_id(video_id)
        if existing:
            logger.info(
                f"Flashcards already exist for video {video_id}, returning existing."
            )
            return existing

        # Get transcript
        transcript = await self.transcript_repo.get_by_video_id(video_id)
        if not transcript:
            raise TranscriptNotFoundError(
                f"No transcript found for video: {video_id}"
            )

        logger.info(f"Generating flashcards for video {video_id}")

        # Truncate transcript if needed
        transcript_text = transcript.transcript_text
        max_chars = 50000
        if len(transcript_text) > max_chars:
            transcript_text = transcript_text[:max_chars]
            logger.warning(
                f"Transcript truncated to {max_chars} chars for video {video_id}"
            )

        # Generate flashcards via LLM
        prompt = FLASHCARD_PROMPT_TEMPLATE.format(transcript=transcript_text)
        response = await self.llm.generate_structured(
            prompt=prompt,
            system_prompt=FLASHCARD_SYSTEM_PROMPT,
        )

        # Parse JSON response
        try:
            flashcard_data = _parse_flashcards_json(response)
        except ValueError as e:
            logger.error(f"Failed to parse flashcards JSON: {e}")
            raise LLMGenerationError(
                "Failed to generate flashcards: could not parse LLM response."
            )

        # Validate structure
        validated_flashcards = []
        for fc in flashcard_data:
            if isinstance(fc, dict) and "question" in fc and "answer" in fc:
                validated_flashcards.append(
                    {"question": str(fc["question"]), "answer": str(fc["answer"])}
                )

        if not validated_flashcards:
            raise LLMGenerationError("No valid flashcards found in LLM response.")

        # Bulk save to DB
        flashcards = await self.flashcard_repo.create_bulk(
            video_id=video_id, flashcards=validated_flashcards
        )

        logger.info(
            f"Successfully generated {len(flashcards)} flashcards for video {video_id}"
        )
        return flashcards

    async def get_flashcards(self, video_id: UUID) -> list[Flashcard]:
        """Get existing flashcards for a video."""
        return await self.flashcard_repo.get_by_video_id(video_id)
