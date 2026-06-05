"""Vector store management using ChromaDB with LangChain integration."""

import chromadb
from langchain_chroma import Chroma
from langchain_core.documents import Document

from app.core.config import get_settings
from app.core.logging_config import get_logger
from app.rag.embeddings import get_embedding_model

logger = get_logger(__name__)


class VectorStoreManager:
    """Manages ChromaDB vector store operations for video transcript embeddings."""

    def __init__(self) -> None:
        settings = get_settings()
        self.persist_directory = str(settings.CHROMA_PERSIST_DIR)
        self._client = chromadb.PersistentClient(path=self.persist_directory)
        self._embedding_model = get_embedding_model()

    def _get_collection_name(self, video_id: str) -> str:
        """Generate a collection name for a video.

        ChromaDB collection names must be 3-63 chars, alphanumeric with
        underscores/hyphens, and start/end with alphanumeric.
        """
        # Sanitize UUID to create a valid collection name
        sanitized = video_id.replace("-", "_")
        return f"video_{sanitized}"

    def _get_chroma_store(self, video_id: str) -> Chroma:
        """Get a LangChain Chroma wrapper for a specific video collection."""
        collection_name = self._get_collection_name(video_id)
        return Chroma(
            client=self._client,
            collection_name=collection_name,
            embedding_function=self._embedding_model,
        )

    async def add_documents(
        self, video_id: str, documents: list[Document]
    ) -> None:
        """Add documents to the vector store for a specific video.

        Args:
            video_id: The video UUID string.
            documents: List of LangChain Document objects to store.
        """
        if not documents:
            logger.warning(f"No documents to add for video {video_id}")
            return

        collection_name = self._get_collection_name(video_id)
        logger.info(
            f"Adding {len(documents)} documents to collection '{collection_name}'"
        )

        chroma_store = self._get_chroma_store(video_id)

        # Add documents in batches to avoid memory issues
        batch_size = 100
        for i in range(0, len(documents), batch_size):
            batch = documents[i : i + batch_size]
            chroma_store.add_documents(batch)

        logger.info(
            f"Successfully added {len(documents)} documents to '{collection_name}'"
        )

    async def similarity_search(
        self, video_id: str, query: str, k: int = 5
    ) -> list[Document]:
        """Search for similar documents in a video's collection.

        Args:
            video_id: The video UUID string.
            query: The search query text.
            k: Number of results to return.

        Returns:
            List of the most similar Document objects.
        """
        chroma_store = self._get_chroma_store(video_id)

        try:
            results = chroma_store.similarity_search(query=query, k=k)
            logger.debug(
                f"Found {len(results)} similar documents for query in video {video_id}"
            )
            return results
        except Exception as e:
            logger.error(
                f"Similarity search failed for video {video_id}: {e}"
            )
            return []

    async def similarity_search_with_score(
        self, video_id: str, query: str, k: int = 5
    ) -> list[tuple[Document, float]]:
        """Search for similar documents with relevance scores.

        Args:
            video_id: The video UUID string.
            query: The search query text.
            k: Number of results to return.

        Returns:
            List of (Document, score) tuples.
        """
        chroma_store = self._get_chroma_store(video_id)

        try:
            results = chroma_store.similarity_search_with_score(query=query, k=k)
            logger.debug(
                f"Found {len(results)} scored documents for query in video {video_id}"
            )
            return results
        except Exception as e:
            logger.error(
                f"Scored similarity search failed for video {video_id}: {e}"
            )
            return []

    async def delete_collection(self, video_id: str) -> None:
        """Delete a video's vector store collection.

        Args:
            video_id: The video UUID string.
        """
        collection_name = self._get_collection_name(video_id)
        try:
            self._client.delete_collection(collection_name)
            logger.info(f"Deleted collection '{collection_name}'")
        except Exception as e:
            logger.warning(
                f"Failed to delete collection '{collection_name}': {e}"
            )
