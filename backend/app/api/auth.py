"""Authentication API endpoints — signup and signin."""

from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_db
from app.core.security import create_access_token, hash_password, verify_password
from app.repositories.user_repo import UserRepository
from app.schemas.auth import SignInRequest, SignUpRequest, TokenResponse, UserOut

router = APIRouter()


@router.post(
    "/signup",
    response_model=TokenResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new account",
)
async def signup(
    request: SignUpRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> TokenResponse:
    """Register a new user with email and password.

    - Returns a JWT access token on success.
    - Returns **409** if the email is already registered.
    """
    repo = UserRepository(db)

    existing = await repo.get_by_email(request.email)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists.",
        )

    user = await repo.create(
        email=request.email,
        hashed_password=hash_password(request.password),
    )

    token = create_access_token(user.id)
    return TokenResponse(
        access_token=token,
        user=UserOut.model_validate(user),
    )


@router.post(
    "/signin",
    response_model=TokenResponse,
    status_code=status.HTTP_200_OK,
    summary="Sign in to an existing account",
)
async def signin(
    request: SignInRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> TokenResponse:
    """Authenticate an existing user.

    - Returns a JWT access token on success.
    - Returns **401** for invalid credentials (email not found or wrong password).
    """
    repo = UserRepository(db)

    user = await repo.get_by_email(request.email)
    # Use a constant-time check so we don't leak whether the email exists
    if not user or not user.hashed_password or not verify_password(
        request.password, user.hashed_password
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = create_access_token(user.id)
    return TokenResponse(
        access_token=token,
        user=UserOut.model_validate(user),
    )
