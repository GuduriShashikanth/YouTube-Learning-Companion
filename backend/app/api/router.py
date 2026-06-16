"""API router aggregation — includes all sub-routers with proper prefixes."""

from fastapi import APIRouter

from app.api import auth, chat, flashcards, health, notes, quizzes, videos

api_router = APIRouter()

# Health check
api_router.include_router(health.router, prefix="/health", tags=["Health"])

# Auth — signup and signin
api_router.include_router(auth.router, prefix="/auth", tags=["Auth"])

# Video CRUD
api_router.include_router(videos.router, prefix="/videos", tags=["Videos"])

# Notes — routes are defined with /videos/{video_id}/notes prefix in the router file
api_router.include_router(notes.router, tags=["Notes"])

# Flashcards — routes are defined with /videos/{video_id}/flashcards prefix in the router file
api_router.include_router(flashcards.router, tags=["Flashcards"])

# Quizzes — routes are defined with /videos/{video_id}/quiz prefix in the router file
api_router.include_router(quizzes.router, tags=["Quizzes"])

# Chat — routes are defined with /videos/{video_id}/chat prefix in the router file
api_router.include_router(chat.router, tags=["Chat"])
