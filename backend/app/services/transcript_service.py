"""Transcript fetching service using youtube-transcript-api v1.x."""

import asyncio

from youtube_transcript_api import YouTubeTranscriptApi
from youtube_transcript_api._errors import (
    CouldNotRetrieveTranscript,
    NoTranscriptFound,
    TranscriptsDisabled,
    VideoUnavailable,
)

from app.core.exceptions import TranscriptFetchError
from app.core.logging_config import get_logger

logger = get_logger(__name__)


def _fetch_transcript_sync(video_id_str: str) -> list[dict]:
    """Synchronous inner call — runs in a thread via asyncio.to_thread().

    youtube-transcript-api v1.x uses an instance-based API:
      api = YouTubeTranscriptApi()
      fetched = api.fetch(video_id, languages=[...])
      raw = fetched.to_raw_data()  # → list[{"text", "start", "duration"}]

    We try English first, then fall back to any available language.
    """
    api = YouTubeTranscriptApi()

    # Try English first, then fall back to any available transcript
    try:
        fetched = api.fetch(video_id_str, languages=["en", "en-US", "en-GB"])
        return fetched.to_raw_data()
    except NoTranscriptFound:
        pass

    # Fall back: list available transcripts and pick the first one
    try:
        transcript_list = api.list(video_id_str)
        available = list(transcript_list)
        if not available:
            raise TranscriptFetchError(
                f"No transcripts available for video: {video_id_str}"
            )
        # Prefer non-auto-generated, then fall back to auto-generated
        preferred = next(
            (t for t in available if not t.is_generated), None
        ) or available[0]
        fetched = preferred.fetch()
        return fetched.to_raw_data()
    except (NoTranscriptFound, TranscriptsDisabled, VideoUnavailable) as exc:
        raise exc  # re-raise to be handled in the async wrapper


class TranscriptService:
    """Service for fetching YouTube video transcripts."""

    async def fetch_transcript(
        self, video_id_str: str
    ) -> tuple[str, list[dict]]:
        """Fetch the transcript for a YouTube video.

        Args:
            video_id_str: The YouTube video ID string.

        Returns:
            A tuple of (full_transcript_text, list_of_timestamp_dicts).

        Raises:
            TranscriptFetchError: If the transcript cannot be fetched.
        """
        try:
            logger.info(f"Fetching transcript for video: {video_id_str}")

            # Run sync I/O in a thread so we don't block the async event loop
            transcript_list = await asyncio.to_thread(
                _fetch_transcript_sync, video_id_str
            )

            # Build the full text and timestamps list
            timestamps = []
            text_parts = []

            for entry in transcript_list:
                text_parts.append(entry["text"])
                timestamps.append(
                    {
                        "text": entry["text"],
                        "start": entry["start"],
                        "duration": entry["duration"],
                    }
                )

            full_text = " ".join(text_parts)
            logger.info(
                f"Successfully fetched transcript for video {video_id_str}: "
                f"{len(full_text)} characters, {len(timestamps)} segments"
            )

            return full_text, timestamps

        except TranscriptFetchError:
            raise
        except TranscriptsDisabled:
            logger.warning(f"Transcripts are disabled for video: {video_id_str}")
            raise TranscriptFetchError(
                f"Transcripts are disabled for video: {video_id_str}"
            )
        except NoTranscriptFound:
            logger.warning(f"No transcript found for video: {video_id_str}")
            raise TranscriptFetchError(
                f"No transcript found for video: {video_id_str}. "
                "The video may not have captions available."
            )
        except VideoUnavailable:
            logger.warning(f"Video unavailable: {video_id_str}")
            raise TranscriptFetchError(
                f"Video is unavailable: {video_id_str}"
            )
        except CouldNotRetrieveTranscript as e:
            logger.error(
                f"Could not retrieve transcript for {video_id_str}: {e}"
            )
            raise TranscriptFetchError(
                f"Failed to retrieve transcript for video {video_id_str}: {str(e)}"
            )
        except Exception as e:
            logger.error(
                f"Unexpected error fetching transcript for {video_id_str}: {e}"
            )
            raise TranscriptFetchError(
                f"Failed to fetch transcript for video {video_id_str}: {str(e)}"
            )
