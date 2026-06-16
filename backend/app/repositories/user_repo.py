"""User repository — database operations for the User model."""

from __future__ import annotations

import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User


class UserRepository:
    """Data-access layer for :class:`User` records."""

    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def get_by_email(self, email: str) -> User | None:
        """Return the user with *email*, or *None* if not found."""
        result = await self._session.execute(
            select(User).where(User.email == email)
        )
        return result.scalar_one_or_none()

    async def get_by_id(self, user_id: uuid.UUID) -> User | None:
        """Return the user with *user_id*, or *None* if not found."""
        result = await self._session.execute(
            select(User).where(User.id == user_id)
        )
        return result.scalar_one_or_none()

    async def create(self, email: str, hashed_password: str) -> User:
        """Create and persist a new user, returning the saved instance."""
        user = User(email=email, hashed_password=hashed_password)
        self._session.add(user)
        await self._session.flush()   # assigns UUID without committing
        return user
