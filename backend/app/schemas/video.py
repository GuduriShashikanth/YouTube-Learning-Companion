"""Video-related Pydantic schemas."""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, field_validator


class VideoProcessRequest(BaseModel):
    """Schema for requesting video processing."""

    youtube_url: str

    @field_validator("youtube_url")
    @classmethod
    def validate_youtube_url(cls, v: str) -> str:
        """Validate that the URL is a valid YouTube URL."""
        v = v.strip()
        valid_prefixes = (
            "https://www.youtube.com/watch",
            "http://www.youtube.com/watch",
            "https://youtube.com/watch",
            "http://youtube.com/watch",
            "https://youtu.be/",
            "http://youtu.be/",
            "https://m.youtube.com/watch",
            "http://m.youtube.com/watch",
            "https://www.youtube.com/embed/",
            "https://www.youtube.com/shorts/",
        )
        if not v.startswith(valid_prefixes):
            raise ValueError(
                "Invalid YouTube URL. Please provide a valid YouTube video URL."
            )
        return v


class VideoResponse(BaseModel):
    """Schema for video response."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    youtube_url: str
    youtube_video_id: str
    title: str | None = None
    created_at: datetime


class VideoListResponse(BaseModel):
    """Schema for paginated video list response."""

    videos: list[VideoResponse]
    total: int
