"""End-to-end RAG pipeline combining retrieval and LLM generation."""

from app.core.logging_config import get_logger
from app.rag.retriever import retrieve_relevant_chunks
from app.services.llm_service import get_llm_service

logger = get_logger(__name__)

RAG_SYSTEM_PROMPT = """You are a helpful AI assistant that answers questions about YouTube video content.
You have been provided with relevant excerpts from the video's transcript along with their timestamps.

Instructions:
- Answer the question based ONLY on the provided transcript context
- Reference specific timestamps when relevant (format: [MM:SS] or [HH:MM:SS])
- If the provided context does not contain enough information to answer the question,
  say "I don't have enough information from the video transcript to answer this question."
- Be concise but thorough in your answers
- Use bullet points or numbered lists for clarity when appropriate
- Do not make up information that is not in the transcript"""

RAG_PROMPT_TEMPLATE = """Context from the video transcript (with timestamps):

{context}

---

Question: {question}

Please answer the question based on the transcript context above:"""


def _format_timestamp(seconds: float | None) -> str:
    """Format seconds into a readable timestamp string."""
    if seconds is None:
        return "N/A"
    total_seconds = int(seconds)
    hours = total_seconds // 3600
    minutes = (total_seconds % 3600) // 60
    secs = total_seconds % 60
    if hours > 0:
        return f"{hours:02d}:{minutes:02d}:{secs:02d}"
    return f"{minutes:02d}:{secs:02d}"


def _build_context(chunks: list[dict]) -> str:
    """Build context string from retrieved chunks with timestamps."""
    context_parts = []
    for i, chunk in enumerate(chunks, 1):
        start = _format_timestamp(chunk.get("start_time"))
        end = _format_timestamp(chunk.get("end_time"))
        text = chunk.get("text", "")
        context_parts.append(f"[{start} - {end}] {text}")
    return "\n\n".join(context_parts)


class RAGPipeline:
    """End-to-end Retrieval-Augmented Generation pipeline."""

    def __init__(self) -> None:
        self.llm = get_llm_service()

    async def answer_question(
        self, video_id: str, question: str, k: int = 5
    ) -> tuple[str, list[dict]]:
        """Answer a question using RAG over a video's transcript.

        Args:
            video_id: The video UUID string.
            question: The user's question.
            k: Number of context chunks to retrieve.

        Returns:
            A tuple of (answer_text, list_of_source_dicts).
        """
        logger.info(f"RAG pipeline: answering question for video {video_id}")

        # 1. Retrieve relevant chunks
        chunks = await retrieve_relevant_chunks(
            video_id=video_id, query=question, k=k
        )

        if not chunks:
            logger.warning(f"No relevant chunks found for video {video_id}")
            return (
                "I don't have enough information from the video transcript "
                "to answer this question. The video may not have been fully "
                "processed or the question may be outside the scope of the video content.",
                [],
            )

        # 2. Build context from retrieved chunks
        context = _build_context(chunks)

        # 3. Generate answer using LLM
        prompt = RAG_PROMPT_TEMPLATE.format(
            context=context,
            question=question,
        )

        answer = await self.llm.generate_structured(
            prompt=prompt,
            system_prompt=RAG_SYSTEM_PROMPT,
        )

        # 4. Format sources
        sources = [
            {
                "text": chunk["text"],
                "start_time": chunk.get("start_time"),
                "end_time": chunk.get("end_time"),
            }
            for chunk in chunks
        ]

        logger.info(
            f"RAG pipeline: generated answer with {len(sources)} sources "
            f"for video {video_id}"
        )
        return answer, sources
