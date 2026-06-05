"""Quiz generation service using LLM."""

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
from app.models.quiz import Quiz
from app.repositories.quiz_repo import QuizRepository
from app.repositories.transcript_repo import TranscriptRepository
from app.repositories.video_repo import VideoRepository
from app.services.llm_service import get_llm_service

logger = get_logger(__name__)

QUIZ_SYSTEM_PROMPT = """You are an expert educational assessment creator. You create high-quality
multiple-choice questions that test comprehension, analysis, and application of concepts.
Each question should have exactly 4 options with one correct answer and a brief explanation."""

QUIZ_PROMPT_TEMPLATE = """Based on the following video transcript, create exactly 10 multiple-choice
questions to test the viewer's understanding of the content.

Requirements:
- Create exactly 10 questions
- Each question should have 4 options (a, b, c, d)
- Only one option should be correct
- Include a brief explanation for the correct answer
- Questions should range from recall to analysis level
- Cover the most important topics from the transcript
- Return ONLY a valid JSON array, no other text

Return the questions in this exact JSON format:
[
    {{
        "question": "What is the main purpose of...?",
        "option_a": "First option",
        "option_b": "Second option",
        "option_c": "Third option",
        "option_d": "Fourth option",
        "correct_answer": "a",
        "explanation": "The correct answer is A because..."
    }}
]

Transcript:
{transcript}

Generate exactly 10 quiz questions as a JSON array:"""


def _parse_quiz_json(response: str) -> list[dict]:
    """Parse the LLM response to extract quiz question JSON."""
    # Try direct parsing
    try:
        return json.loads(response)
    except json.JSONDecodeError:
        pass

    # Try markdown code block extraction
    json_match = re.search(r"```(?:json)?\s*\n?(.*?)\n?```", response, re.DOTALL)
    if json_match:
        try:
            return json.loads(json_match.group(1))
        except json.JSONDecodeError:
            pass

    # Try bracket extraction
    bracket_match = re.search(r"\[.*\]", response, re.DOTALL)
    if bracket_match:
        try:
            return json.loads(bracket_match.group(0))
        except json.JSONDecodeError:
            pass

    raise ValueError("Could not parse quiz JSON from LLM response")


class QuizService:
    """Service for generating quizzes from video transcripts."""

    def __init__(self, session: AsyncSession) -> None:
        self.session = session
        self.quiz_repo = QuizRepository(session)
        self.transcript_repo = TranscriptRepository(session)
        self.video_repo = VideoRepository(session)
        self.llm = get_llm_service()

    async def generate_quiz(self, video_id: UUID) -> Quiz:
        """Generate a quiz for a video using its transcript.

        Args:
            video_id: The UUID of the video.

        Returns:
            The created Quiz object with questions.

        Raises:
            VideoNotFoundError: If the video doesn't exist.
            TranscriptNotFoundError: If no transcript is found.
            LLMGenerationError: If the LLM response can't be parsed.
        """
        # Verify video exists
        video = await self.video_repo.get_by_id(video_id)
        if not video:
            raise VideoNotFoundError(f"Video not found: {video_id}")

        # Check for existing quiz
        existing_quiz = await self.quiz_repo.get_by_video_id(video_id)
        if existing_quiz:
            logger.info(
                f"Quiz already exists for video {video_id}, returning existing."
            )
            return existing_quiz

        # Get transcript
        transcript = await self.transcript_repo.get_by_video_id(video_id)
        if not transcript:
            raise TranscriptNotFoundError(
                f"No transcript found for video: {video_id}"
            )

        logger.info(f"Generating quiz for video {video_id}")

        # Truncate transcript if needed
        transcript_text = transcript.transcript_text
        max_chars = 50000
        if len(transcript_text) > max_chars:
            transcript_text = transcript_text[:max_chars]
            logger.warning(
                f"Transcript truncated to {max_chars} chars for video {video_id}"
            )

        # Generate quiz via LLM
        prompt = QUIZ_PROMPT_TEMPLATE.format(transcript=transcript_text)
        response = await self.llm.generate_structured(
            prompt=prompt,
            system_prompt=QUIZ_SYSTEM_PROMPT,
        )

        # Parse JSON response
        try:
            quiz_data = _parse_quiz_json(response)
        except ValueError as e:
            logger.error(f"Failed to parse quiz JSON: {e}")
            raise LLMGenerationError(
                "Failed to generate quiz: could not parse LLM response."
            )

        # Validate and normalize question structure
        required_fields = {
            "question",
            "option_a",
            "option_b",
            "option_c",
            "option_d",
            "correct_answer",
        }
        validated_questions = []
        for q in quiz_data:
            if isinstance(q, dict) and required_fields.issubset(q.keys()):
                # Normalize correct_answer to lowercase single letter
                correct = str(q["correct_answer"]).strip().lower()
                if correct not in ("a", "b", "c", "d"):
                    continue
                validated_questions.append(
                    {
                        "question": str(q["question"]),
                        "option_a": str(q["option_a"]),
                        "option_b": str(q["option_b"]),
                        "option_c": str(q["option_c"]),
                        "option_d": str(q["option_d"]),
                        "correct_answer": correct,
                        "explanation": str(q.get("explanation", "")),
                    }
                )

        if not validated_questions:
            raise LLMGenerationError("No valid quiz questions found in LLM response.")

        # Save quiz with questions to DB
        quiz = await self.quiz_repo.create_with_questions(
            video_id=video_id, questions=validated_questions
        )

        logger.info(
            f"Successfully generated quiz with {len(validated_questions)} "
            f"questions for video {video_id}"
        )
        return quiz

    async def get_quiz(self, video_id: UUID) -> Quiz | None:
        """Get an existing quiz for a video."""
        return await self.quiz_repo.get_by_video_id(video_id)
