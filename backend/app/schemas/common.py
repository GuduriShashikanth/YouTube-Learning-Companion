"""Common response schemas used across the application."""

from pydantic import BaseModel


class MessageResponse(BaseModel):
    """Generic message response schema."""

    message: str
    success: bool = True
