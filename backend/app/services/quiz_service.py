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

QUIZ_SYSTEM_PROMPT = """You are a rigorous academic assessment designer creating university-level
multiple-choice questions. Your questions must:
- Test deep understanding, NOT surface-level recall
- Be phrased as direct, standalone questions — NEVER start with phrases like
  "According to the transcript", "Based on the video", "As mentioned", or similar
- Have exactly 4 options where ALL distractors are plausible and tempting;
  wrong answers must reflect common misconceptions, not obvious nonsense
- Have only one unambiguously correct answer
- Include a concise explanation that justifies the correct answer and
  clarifies why the other options are wrong"""

QUIZ_PROMPT_TEMPLATE = """Using the video content below as your knowledge source, design exactly 10
challenging multiple-choice questions.

STRICT RULES:
1. Phrase every question as a direct, standalone question — NEVER use
   "According to the transcript", "Based on the video", "As mentioned", etc.
2. Questions must test conceptual understanding, cause-effect relationships,
   comparisons, or application — NOT simple word-spotting from the text.
3. Every wrong option (distractor) must be a plausible-sounding alternative
   that a student who partially understood the topic might choose.
   Bad distractor: "It is primarily used for game development" (obviously wrong)
   Good distractor: "It optimizes memory allocation at the hardware level" (sounds technical, subtly wrong)
4. Vary difficulty: 3 medium, 4 hard, 3 very hard questions.
5. Cover distinct topics — do not repeat similar concepts across questions.
6. Return ONLY a valid JSON array, no prose, no markdown fences.

JSON format (return exactly this structure):
[
    {{
        "question": "Direct, self-contained question text?",
        "option_a": "Plausible option A",
        "option_b": "Plausible option B",
        "option_c": "Plausible option C",
        "option_d": "Plausible option D",
        "correct_answer": "a",
        "explanation": "Concise explanation of why A is correct and why B/C/D are wrong."
    }}
]

Video content:
{transcript}

Generate exactly 10 quiz questions as a raw JSON array:"""



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

    async def generate_quiz(self, video_id: UUID, force: bool = False) -> Quiz:
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

        # Check for existing quiz — skip if force regeneration requested
        existing_quiz = await self.quiz_repo.get_by_video_id(video_id)
        has_valid_quiz = existing_quiz and len(existing_quiz.questions) > 0

        if has_valid_quiz and not force:
            logger.info(
                f"Quiz already exists for video {video_id}, returning existing."
            )
            return existing_quiz

        if existing_quiz and (force or not has_valid_quiz):
            logger.info(f"Deleting existing quiz for video {video_id} (force={force}, valid={has_valid_quiz}).")
            await self.quiz_repo.delete_by_video_id(video_id)

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

        # Patterns to strip from question text
        import re as _re
        _TRANSCRIPT_PREFIX = _re.compile(
            r"^(according to (the )?(transcript|video|passage|content|speaker|narrator)[,:]?\s*"
            r"|based on (the )?(transcript|video|passage|content)[,:]?\s*"
            r"|as (mentioned|stated|discussed|explained) in (the )?(transcript|video)[,:]?\s*)",
            _re.IGNORECASE,
        )

        def _clean_question(text: str) -> str:
            cleaned = _TRANSCRIPT_PREFIX.sub("", text.strip())
            # Capitalize first letter after stripping
            return cleaned[:1].upper() + cleaned[1:] if cleaned else text

        for q in quiz_data:
            if isinstance(q, dict) and required_fields.issubset(q.keys()):
                # Normalize correct_answer to lowercase single letter
                correct = str(q["correct_answer"]).strip().lower()
                if correct not in ("a", "b", "c", "d"):
                    continue
                validated_questions.append(
                    {
                        "question": _clean_question(str(q["question"])),
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
