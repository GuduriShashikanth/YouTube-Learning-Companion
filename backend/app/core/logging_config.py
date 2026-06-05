"""Structured logging configuration."""

import logging
import sys
from datetime import datetime, timezone

from app.core.config import get_settings


class UTCFormatter(logging.Formatter):
    """Formatter that uses UTC timestamps for consistency across environments."""

    def formatTime(self, record: logging.LogRecord, datefmt: str | None = None) -> str:
        dt = datetime.fromtimestamp(record.created, tz=timezone.utc)
        if datefmt:
            return dt.strftime(datefmt)
        return dt.strftime("%Y-%m-%d %H:%M:%S")


def setup_logging() -> None:
    """Configure root logger with structured format and level from settings."""
    settings = get_settings()
    level = getattr(logging, settings.LOG_LEVEL.upper(), logging.INFO)

    formatter = UTCFormatter(
        fmt="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
    )

    # Console handler
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setFormatter(formatter)
    console_handler.setLevel(level)

    # Configure root logger
    root_logger = logging.getLogger()
    root_logger.setLevel(level)

    # Remove existing handlers to avoid duplicates on repeated calls
    root_logger.handlers.clear()
    root_logger.addHandler(console_handler)

    # Silence noisy third-party loggers
    for noisy_logger in ("httpcore", "httpx", "chromadb", "urllib3"):
        logging.getLogger(noisy_logger).setLevel(logging.WARNING)


def get_logger(name: str) -> logging.Logger:
    """Return a named logger. Call setup_logging() once at app startup before using this."""
    return logging.getLogger(name)
