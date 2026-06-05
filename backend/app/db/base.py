"""SQLAlchemy DeclarativeBase and shared mixins."""

import uuid
from datetime import datetime

from sqlalchemy import func
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


class Base(DeclarativeBase):
    """Base class for all ORM models."""

    pass


class TimestampMixin:
    """Mixin that adds id, created_at, and updated_at columns to any model."""

    id: Mapped[uuid.UUID] = mapped_column(
        primary_key=True,
        default=uuid.uuid4,
    )
    created_at: Mapped[datetime] = mapped_column(
        server_default=func.now(),
    )
    updated_at: Mapped[datetime | None] = mapped_column(
        default=None,
        onupdate=func.now(),
        server_default=None,
    )
