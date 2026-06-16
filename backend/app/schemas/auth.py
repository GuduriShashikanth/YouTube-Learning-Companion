"""Pydantic schemas for authentication endpoints."""

from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, EmailStr, field_validator


class SignUpRequest(BaseModel):
    """Request body for POST /auth/signup."""

    email: EmailStr
    password: str

    @field_validator("password")
    @classmethod
    def password_min_length(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters.")
        return v


class SignInRequest(BaseModel):
    """Request body for POST /auth/signin."""

    email: EmailStr
    password: str


class UserOut(BaseModel):
    """Public user representation returned inside token responses."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    email: str
    created_at: datetime


class TokenResponse(BaseModel):
    """Response returned after successful signup or signin."""

    access_token: str
    token_type: str = "bearer"
    user: UserOut
