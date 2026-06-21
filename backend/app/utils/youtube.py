"""YouTube URL parsing and validation utilities."""

from __future__ import annotations

import asyncio
import re
import httpx
from app.core.logging_config import get_logger

logger = get_logger(__name__)


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


async def fetch_video_metadata(youtube_url: str, video_id: str) -> dict:
    """Fetch video metadata: title, channel_name, duration, thumbnail_url.

    Attempts to use yt-dlp first. If it fails or is not installed, falls back to oEmbed.
    """
    metadata = {
        "title": None,
        "channel_name": None,
        "duration": None,
        "thumbnail_url": None,
    }

    # 1. Try yt-dlp first
    try:
        import yt_dlp

        def _extract():
            ydl_opts = {
                'skip_download': True,
                'quiet': True,
                'no_warnings': True,
                'noplaylist': True,  # don't expand playlists
            }
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                return ydl.extract_info(youtube_url, download=False)

        # Run in a thread pool to avoid blocking the event loop
        info = await asyncio.to_thread(_extract)
        if info:
            metadata["title"] = info.get("title")
            metadata["channel_name"] = info.get("uploader") or info.get("channel")
            metadata["duration"] = int(info.get("duration")) if info.get("duration") else None
            metadata["thumbnail_url"] = info.get("thumbnail")
            logger.info("Successfully fetched video metadata using yt-dlp")
            return metadata
    except ImportError:
        logger.warning("yt-dlp is not installed. Falling back to oEmbed.")
    except Exception as e:
        logger.warning(f"yt-dlp failed to fetch metadata: {e}. Falling back to oEmbed.")

    # 2. Fallback to YouTube oEmbed API
    try:
        url = f"https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v={video_id}&format=json"
        async with httpx.AsyncClient() as client:
            response = await client.get(url, timeout=5.0)
            if response.status_code == 200:
                data = response.json()
                metadata["title"] = data.get("title")
                metadata["channel_name"] = data.get("author_name")
                metadata["thumbnail_url"] = data.get("thumbnail_url")
                logger.info("Successfully fetched video metadata using YouTube oEmbed")
            else:
                logger.warning(f"oEmbed API returned status code {response.status_code}")
    except Exception as e:
        logger.error(f"oEmbed API request failed: {e}")

    # 3. Fallback for thumbnail if still missing
    if not metadata["thumbnail_url"]:
        metadata["thumbnail_url"] = f"https://i.ytimg.com/vi/{video_id}/maxresdefault.jpg"

    return metadata
