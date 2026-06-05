"""FastAPI dependency-injection providers."""

from collections.abc import AsyncGenerator

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import Settings, get_settings as _get_settings
from app.db.database import async_session_factory


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """Yield an async SQLAlchemy session and ensure it is closed after use."""
    async with async_session_factory() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise


def get_settings() -> Settings:
    """Return the cached Settings singleton."""
    return _get_settings()
