"""YouTube Learning Companion — FastAPI application entry point."""

from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.router import api_router
from app.core.config import get_settings
from app.core.exceptions import (
    InvalidYouTubeURLError,
    LLMError,
    TranscriptFetchError,
    TranscriptNotFoundError,
    VideoNotFoundError,
)
from app.core.logging_config import get_logger, setup_logging

setup_logging()
logger = get_logger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan context manager for startup/shutdown events."""
    # Clear cached settings so any .env changes after reload are picked up
    from app.core.config import get_settings as _gs
    _gs.cache_clear()

    # Startup
    logger.info("Starting YouTube Learning Companion API...")

    settings = get_settings()

    # Optionally create DB tables in development mode
    if settings.ENVIRONMENT == "development":
        try:
            from app.db.base import Base
            from app.db.database import engine

            async with engine.begin() as conn:
                await conn.run_sync(Base.metadata.create_all)
            logger.info("Database tables created/verified (development mode)")
        except Exception as e:
            logger.error(f"Failed to create database tables: {e}")

    logger.info(
        f"Application started successfully in {settings.ENVIRONMENT} mode"
    )

    yield

    # Shutdown
    logger.info("Shutting down YouTube Learning Companion API...")
    logger.info("Application shutdown complete")


def create_app() -> FastAPI:
    """Create and configure the FastAPI application."""
    settings = get_settings()

    app = FastAPI(
        title="YouTube Learning Companion",
        description=(
            "An AI-powered backend for learning from YouTube videos. "
            "Process videos, generate study notes, flashcards, quizzes, "
            "and chat with video content using RAG."
        ),
        version="1.0.0",
        lifespan=lifespan,
    )

    # CORS middleware
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # --- Exception handlers ---

    @app.exception_handler(VideoNotFoundError)
    async def video_not_found_handler(
        request: Request, exc: VideoNotFoundError
    ) -> JSONResponse:
        return JSONResponse(
            status_code=404,
            content={"detail": str(exc), "error_type": "video_not_found"},
        )

    @app.exception_handler(TranscriptNotFoundError)
    async def transcript_not_found_handler(
        request: Request, exc: TranscriptNotFoundError
    ) -> JSONResponse:
        return JSONResponse(
            status_code=404,
            content={"detail": str(exc), "error_type": "transcript_not_found"},
        )

    @app.exception_handler(InvalidYouTubeURLError)
    async def invalid_url_handler(
        request: Request, exc: InvalidYouTubeURLError
    ) -> JSONResponse:
        return JSONResponse(
            status_code=400,
            content={"detail": str(exc), "error_type": "invalid_youtube_url"},
        )

    @app.exception_handler(TranscriptFetchError)
    async def transcript_fetch_handler(
        request: Request, exc: TranscriptFetchError
    ) -> JSONResponse:
        return JSONResponse(
            status_code=502,
            content={"detail": str(exc), "error_type": "transcript_fetch_error"},
        )

    @app.exception_handler(LLMError)
    async def llm_error_handler(
        request: Request, exc: LLMError
    ) -> JSONResponse:
        return JSONResponse(
            status_code=502,
            content={"detail": str(exc), "error_type": "llm_error"},
        )

    @app.exception_handler(Exception)
    async def generic_exception_handler(
        request: Request, exc: Exception
    ) -> JSONResponse:
        logger.error(f"Unhandled exception: {exc}", exc_info=True)
        return JSONResponse(
            status_code=500,
            content={
                "detail": "An internal server error occurred.",
                "error_type": "internal_error",
            },
        )

    # --- Routes ---

    @app.get("/", tags=["Root"])
    async def root() -> dict:
        """Root endpoint with API information."""
        return {
            "name": "YouTube Learning Companion",
            "version": "1.0.0",
            "docs_url": "/docs",
        }

    # Include all API routes
    app.include_router(api_router, prefix="/api/v1")

    return app


# Create the application instance
app = create_app()
