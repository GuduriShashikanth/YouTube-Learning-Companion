"""Transcript chunking utilities for RAG pipeline."""

from langchain_core.documents import Document
from langchain_text_splitters import RecursiveCharacterTextSplitter

from app.core.logging_config import get_logger

logger = get_logger(__name__)


def chunk_transcript(
    transcript_text: str,
    timestamps: list[dict],
    chunk_size: int = 500,
    chunk_overlap: int = 50,
) -> list[Document]:
    """Split transcript text into chunks with timestamp metadata.

    Uses RecursiveCharacterTextSplitter to create overlapping chunks,
    then maps each chunk back to its corresponding timestamps by tracking
    character offsets through the original timestamp segments.

    Args:
        transcript_text: The full transcript text.
        timestamps: List of dicts with 'text', 'start', and 'duration' keys.
        chunk_size: Maximum characters per chunk.
        chunk_overlap: Number of overlapping characters between chunks.

    Returns:
        List of LangChain Document objects with metadata.
    """
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=chunk_size,
        chunk_overlap=chunk_overlap,
        length_function=len,
        separators=["\n\n", "\n", ". ", " ", ""],
    )

    # Split the text into chunks
    text_chunks = splitter.split_text(transcript_text)

    if not text_chunks:
        logger.warning("No chunks produced from transcript text")
        return []

    # Build a character offset index from timestamps
    # Each timestamp entry maps to a segment of the full text
    segment_offsets = []
    current_offset = 0
    for ts in timestamps:
        text = ts.get("text", "")
        start_time = ts.get("start", 0.0)
        duration = ts.get("duration", 0.0)
        end_time = start_time + duration

        segment_offsets.append(
            {
                "start_char": current_offset,
                "end_char": current_offset + len(text),
                "start_time": start_time,
                "end_time": end_time,
            }
        )
        # Account for the space that joins segments in full_text
        current_offset += len(text) + 1  # +1 for the space separator

    # Map each chunk to its timestamp range
    documents = []
    search_start = 0

    for chunk_index, chunk_text in enumerate(text_chunks):
        # Find where this chunk appears in the full text
        chunk_pos = transcript_text.find(chunk_text, search_start)
        if chunk_pos == -1:
            # Fallback: search from beginning
            chunk_pos = transcript_text.find(chunk_text)

        chunk_end_pos = chunk_pos + len(chunk_text) if chunk_pos >= 0 else 0

        # Update search position (move forward accounting for overlap)
        if chunk_pos >= 0:
            search_start = max(search_start, chunk_pos + len(chunk_text) - chunk_overlap)

        # Find timestamp range for this chunk
        start_time = 0.0
        end_time = 0.0

        if chunk_pos >= 0 and segment_offsets:
            for seg in segment_offsets:
                if seg["end_char"] > chunk_pos:
                    start_time = seg["start_time"]
                    break

            for seg in reversed(segment_offsets):
                if seg["start_char"] < chunk_end_pos:
                    end_time = seg["end_time"]
                    break

        doc = Document(
            page_content=chunk_text,
            metadata={
                "chunk_index": chunk_index,
                "start_time": start_time,
                "end_time": end_time,
                "char_start": chunk_pos if chunk_pos >= 0 else 0,
                "char_end": chunk_end_pos,
            },
        )
        documents.append(doc)

    logger.info(
        f"Chunked transcript into {len(documents)} documents "
        f"(chunk_size={chunk_size}, overlap={chunk_overlap})"
    )
    return documents
