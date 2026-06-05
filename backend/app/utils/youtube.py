"""YouTube URL parsing and validation utilities."""

from __future__ import annotations

import re


# Regex patterns covering all common YouTube URL formats
_YOUTUBE_PATTERNS: list[re.Pattern[str]] = [
    # Standard: https://www.youtube.com/watch?v=VIDEO_ID
    re.compile(
        r"(?:https?://)?(?:www\.)?youtube\.com/watch\?.*?v=(?P<id>[a-zA-Z0-9_-]{11})"
    ),
    # Short: https://youtu.be/VIDEO_ID
    re.compile(
        r"(?:https?://)?youtu\.be/(?P<id>[a-zA-Z0-9_-]{11})"
    ),
    # Embed: https://www.youtube.com/embed/VIDEO_ID
    re.compile(
        r"(?:https?://)?(?:www\.)?youtube\.com/embed/(?P<id>[a-zA-Z0-9_-]{11})"
    ),
    # Shorts: https://www.youtube.com/shorts/VIDEO_ID
    re.compile(
        r"(?:https?://)?(?:www\.)?youtube\.com/shorts/(?P<id>[a-zA-Z0-9_-]{11})"
    ),
    # Music: https://music.youtube.com/watch?v=VIDEO_ID
    re.compile(
        r"(?:https?://)?music\.youtube\.com/watch\?.*?v=(?P<id>[a-zA-Z0-9_-]{11})"
    ),
    # No-cookie embed: https://www.youtube-nocookie.com/embed/VIDEO_ID
    re.compile(
        r"(?:https?://)?(?:www\.)?youtube-nocookie\.com/embed/(?P<id>[a-zA-Z0-9_-]{11})"
    ),
]


def extract_video_id(url: str) -> str | None:
    """Extract the 11-character video ID from a YouTube URL.

    Supports youtube.com/watch, youtu.be, youtube.com/embed,
    youtube.com/shorts, music.youtube.com, and youtube-nocookie.com.

    Returns None if the URL does not match any known pattern.
    """
    url = url.strip()
    for pattern in _YOUTUBE_PATTERNS:
        match = pattern.search(url)
        if match:
            return match.group("id")
    return None


def validate_youtube_url(url: str) -> bool:
    """Return True if *url* is a recognisable YouTube URL with a valid video ID."""
    return extract_video_id(url) is not None


def format_timestamp(seconds: float) -> str:
    """Convert a duration in seconds to HH:MM:SS format.

    Examples
    --------
    >>> format_timestamp(3661.5)
    '01:01:01'
    >>> format_timestamp(62)
    '00:01:02'
    >>> format_timestamp(0)
    '00:00:00'
    """
    total_seconds = int(seconds)
    hours, remainder = divmod(total_seconds, 3600)
    minutes, secs = divmod(remainder, 60)
    return f"{hours:02d}:{minutes:02d}:{secs:02d}"
