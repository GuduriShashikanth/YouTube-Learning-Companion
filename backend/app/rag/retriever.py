"""Retriever module for fetching relevant transcript chunks."""

from app.core.logging_config import get_logger
from app.rag.vector_store import VectorStoreManager

logger = get_logger(__name__)


async def retrieve_relevant_chunks(
    video_id: str, query: str, k: int = 5
) -> list[dict]:
    """Retrieve relevant transcript chunks for a query.

    Uses the vector store to find the most similar chunks to the query,
    then formats them with timestamp information.

    Args:
        video_id: The video UUID string.
        query: The user's question/search query.
        k: Number of chunks to retrieve.

    Returns:
        List of dicts with 'text', 'start_time', 'end_time', and 'score' keys.
    """
    vector_store = VectorStoreManager()

    # Get results with scores
    results = await vector_store.similarity_search_with_score(
        video_id=video_id, query=query, k=k
    )

    chunks = []
    for doc, score in results:
        chunk = {
            "text": doc.page_content,
            "start_time": doc.metadata.get("start_time"),
            "end_time": doc.metadata.get("end_time"),
            "score": float(score),
            "chunk_index": doc.metadata.get("chunk_index"),
        }
        chunks.append(chunk)

    logger.debug(
        f"Retrieved {len(chunks)} relevant chunks for video {video_id}"
    )
    return chunks
