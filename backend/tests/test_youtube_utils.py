"""Tests for YouTube URL utility functions."""

import pytest

from app.utils.youtube import extract_video_id, validate_youtube_url as is_valid_youtube_url


class TestExtractVideoId:
    """Test cases for extract_video_id function."""

    def test_standard_youtube_url(self):
        """Test standard youtube.com watch URL."""
        url = "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
        assert extract_video_id(url) == "dQw4w9WgXcQ"

    def test_standard_url_without_www(self):
        """Test youtube.com URL without www prefix."""
        url = "https://youtube.com/watch?v=dQw4w9WgXcQ"
        assert extract_video_id(url) == "dQw4w9WgXcQ"

    def test_http_url(self):
        """Test HTTP (non-HTTPS) YouTube URL."""
        url = "http://www.youtube.com/watch?v=dQw4w9WgXcQ"
        assert extract_video_id(url) == "dQw4w9WgXcQ"

    def test_short_url(self):
        """Test youtu.be short URL format."""
        url = "https://youtu.be/dQw4w9WgXcQ"
        assert extract_video_id(url) == "dQw4w9WgXcQ"

    def test_short_url_with_params(self):
        """Test youtu.be URL with query parameters."""
        url = "https://youtu.be/dQw4w9WgXcQ?t=42"
        assert extract_video_id(url) == "dQw4w9WgXcQ"

    def test_url_with_extra_params(self):
        """Test URL with additional query parameters."""
        url = "https://www.youtube.com/watch?v=dQw4w9WgXcQ&list=PLtest&index=1"
        assert extract_video_id(url) == "dQw4w9WgXcQ"

    def test_embed_url(self):
        """Test YouTube embed URL format."""
        url = "https://www.youtube.com/embed/dQw4w9WgXcQ"
        assert extract_video_id(url) == "dQw4w9WgXcQ"

    def test_shorts_url(self):
        """Test YouTube Shorts URL format."""
        url = "https://www.youtube.com/shorts/dQw4w9WgXcQ"
        assert extract_video_id(url) == "dQw4w9WgXcQ"

    def test_mobile_url(self):
        """Test mobile YouTube URL."""
        url = "https://m.youtube.com/watch?v=dQw4w9WgXcQ"
        assert extract_video_id(url) == "dQw4w9WgXcQ"

    def test_invalid_url_returns_none(self):
        """Test that invalid URLs return None."""
        assert extract_video_id("https://www.google.com") is None

    def test_empty_string_returns_none(self):
        """Test that empty string returns None."""
        assert extract_video_id("") is None

    def test_random_text_returns_none(self):
        """Test that random text returns None."""
        assert extract_video_id("not a url at all") is None

    def test_url_missing_video_id_param(self):
        """Test YouTube URL without the v parameter."""
        url = "https://www.youtube.com/watch?list=PLtest"
        assert extract_video_id(url) is None

    def test_different_video_ids(self):
        """Test extraction with various valid video ID formats."""
        # YouTube video IDs are 11 characters, alphanumeric + _ and -
        test_cases = [
            ("https://youtu.be/abc123DEF-_", "abc123DEF-_"),
            ("https://www.youtube.com/watch?v=12345678901", "12345678901"),
        ]
        for url, expected_id in test_cases:
            assert extract_video_id(url) == expected_id


class TestIsValidYoutubeUrl:
    """Test cases for is_valid_youtube_url function."""

    def test_valid_standard_url(self):
        """Test that standard YouTube URL is valid."""
        assert is_valid_youtube_url("https://www.youtube.com/watch?v=dQw4w9WgXcQ") is True

    def test_valid_short_url(self):
        """Test that short YouTube URL is valid."""
        assert is_valid_youtube_url("https://youtu.be/dQw4w9WgXcQ") is True

    def test_valid_embed_url(self):
        """Test that embed YouTube URL is valid."""
        assert is_valid_youtube_url("https://www.youtube.com/embed/dQw4w9WgXcQ") is True

    def test_invalid_url(self):
        """Test that non-YouTube URL is invalid."""
        assert is_valid_youtube_url("https://www.google.com") is False

    def test_empty_url(self):
        """Test that empty string is invalid."""
        assert is_valid_youtube_url("") is False

    def test_none_like_value(self):
        """Test that random text is invalid."""
        assert is_valid_youtube_url("definitely not a youtube url") is False
