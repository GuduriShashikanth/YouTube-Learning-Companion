"""User model."""

from __future__ import annotations

import uuid
from typing import TYPE_CHECKING

from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin

if TYPE_CHECKING:
    from app.models.video import Video


class User(TimestampMixin, Base):
    """Registered application user."""

    __tablename__ = "users"

    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)

    # Relationships
    videos: Mapped[list[Video]] = relationship(
        "Video",
        back_populates="user",
        cascade="all, delete-orphan",
        lazy="selectin",
    )

    def __repr__(self) -> str:
        return f"<User id={self.id} email={self.email!r}>"
