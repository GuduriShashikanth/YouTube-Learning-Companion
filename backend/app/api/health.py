"""Health check endpoint."""

from datetime import datetime, timezone

from fastapi import APIRouter

router = APIRouter()


@router.get("")
async def health_check() -> dict:
    """Check the health status of the application.

    Returns:
        A dict with status and current timestamp.
    """
    return {
        "status": "healthy",
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
