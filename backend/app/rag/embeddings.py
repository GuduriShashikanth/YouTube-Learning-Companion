"""Embedding model management for RAG pipeline."""

from functools import lru_cache

from langchain_huggingface import HuggingFaceEmbeddings

from app.core.config import get_settings
from app.core.logging_config import get_logger

logger = get_logger(__name__)


@lru_cache(maxsize=1)
def get_embedding_model() -> HuggingFaceEmbeddings:
    """Get or create the singleton HuggingFace embedding model.

    The model is cached after first creation using lru_cache.
    Uses the model name from application settings.

    Returns:
        A HuggingFaceEmbeddings instance.
    """
    settings = get_settings()
    model_name = settings.EMBEDDING_MODEL

    logger.info(f"Initializing embedding model: {model_name}")

    embedding_model = HuggingFaceEmbeddings(
        model_name=model_name,
        model_kwargs={"device": "cpu"},
        encode_kwargs={"normalize_embeddings": True},
    )

    logger.info(f"Embedding model '{model_name}' initialized successfully")
    return embedding_model
