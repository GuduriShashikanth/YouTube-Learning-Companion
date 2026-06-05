"""Custom application exceptions and FastAPI exception handlers."""

from __future__ import annotations

from typing import Any

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse


# ---------------------------------------------------------------------------
# Base exception
# ---------------------------------------------------------------------------

class AppException(Exception):
    """Base exception for the application. All custom exceptions extend this."""

    status_code: int = 500
    detail: str = "An unexpected error occurred."

    def __init__(self, detail: str | None = None, status_code: int | None = None) -> None:
        self.detail = detail or self.__class__.detail
        self.status_code = status_code or self.__class__.status_code
        super().__init__(self.detail)


# ---------------------------------------------------------------------------
# Specific exceptions
# ---------------------------------------------------------------------------

class VideoNotFoundError(AppException):
    """Raised when a requested video does not exist in the database."""

    status_code: int = 404
    detail: str = "Video not found."


class TranscriptNotFoundError(AppException):
    """Raised when a transcript has not been stored for a video."""

    status_code: int = 404
    detail: str = "Transcript not found for this video."


class TranscriptFetchError(AppException):
    """Raised when fetching the transcript from YouTube fails."""

    status_code: int = 502
    detail: str = "Failed to fetch transcript from YouTube."


class LLMError(AppException):
    """Raised when an LLM call (Gemini / OpenAI) fails."""

    status_code: int = 502
    detail: str = "LLM request failed."


class LLMGenerationError(LLMError):
    """Raised when LLM output cannot be parsed into the expected structure (e.g. invalid JSON)."""

    status_code: int = 502
    detail: str = "LLM generation failed."


class InvalidYouTubeURLError(AppException):
    """Raised when a provided URL is not a valid YouTube URL."""

    status_code: int = 422
    detail: str = "Invalid YouTube URL."


# ---------------------------------------------------------------------------
# Exception handler registration
# ---------------------------------------------------------------------------

def _build_error_body(status_code: int, detail: str) -> dict[str, Any]:
    return {
        "error": True,
        "status_code": status_code,
        "detail": detail,
    }


async def _app_exception_handler(_request: Request, exc: AppException) -> JSONResponse:
    return JSONResponse(
        status_code=exc.status_code,
        content=_build_error_body(exc.status_code, exc.detail),
    )


async def _generic_exception_handler(_request: Request, exc: Exception) -> JSONResponse:
    return JSONResponse(
        status_code=500,
        content=_build_error_body(500, "Internal server error."),
    )


def register_exception_handlers(app: FastAPI) -> None:
    """Register custom exception handlers on the FastAPI application instance."""
    app.add_exception_handler(AppException, _app_exception_handler)  # type: ignore[arg-type]
    app.add_exception_handler(Exception, _generic_exception_handler)
