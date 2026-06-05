"""Import all models so Alembic and Base.metadata can discover them."""

from app.models.user import User
from app.models.video import Video
from app.models.transcript import Transcript
from app.models.note import Note
from app.models.flashcard import Flashcard
from app.models.quiz import Quiz
from app.models.quiz_question import QuizQuestion
from app.models.chat_history import ChatHistory

__all__ = [
    "User",
    "Video",
    "Transcript",
    "Note",
    "Flashcard",
    "Quiz",
    "QuizQuestion",
    "ChatHistory",
]
