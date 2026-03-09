"""
ChromaDB Vector Store
Stores resume embeddings for semantic search and candidate matching.
Uses sentence-transformers/all-MiniLM-L6-v2 via ChromaDB's built-in embedding support.

Note: ChromaDB is optional — if it fails to import (e.g. pydantic v1/v2 conflict
on Python 3.14), the backend still runs with no-op vector functions.
"""

import os
from dotenv import load_dotenv

load_dotenv()

CHROMA_PERSIST_DIR = os.getenv("CHROMA_PERSIST_DIR", "./chroma_data")
CHROMA_AVAILABLE = False
resumes_collection = None

try:
    import chromadb
    from chromadb.utils import embedding_functions

    chroma_client = chromadb.PersistentClient(path=CHROMA_PERSIST_DIR)
    sentence_transformer_ef = embedding_functions.SentenceTransformerEmbeddingFunction(
        model_name="all-MiniLM-L6-v2"
    )
    resumes_collection = chroma_client.get_or_create_collection(
        name="resumes",
        embedding_function=sentence_transformer_ef,
        metadata={"hnsw:space": "cosine"},
    )
    CHROMA_AVAILABLE = True
    print("[vectorstore] ChromaDB initialized successfully")
except Exception as e:
    print(f"[vectorstore] ChromaDB unavailable ({e}). Vector search disabled.")


def store_resume_embedding(candidate_id: str, text: str, metadata: dict = None):
    """
    Embed resume text and upsert into ChromaDB.

    Args:
        candidate_id: UUID string of the candidate
        text: Full resume text to embed
        metadata: Optional metadata dict (name, skills, etc.)
    """
    if not CHROMA_AVAILABLE or not resumes_collection:
        return
    if not text or not text.strip():
        return

    doc_metadata = metadata or {}
    # ChromaDB metadata values must be str, int, float, or bool
    clean_metadata = {}
    for k, v in doc_metadata.items():
        if isinstance(v, (str, int, float, bool)):
            clean_metadata[k] = v
        elif isinstance(v, list):
            clean_metadata[k] = ", ".join(str(item) for item in v)
        elif v is not None:
            clean_metadata[k] = str(v)

    # Truncate text to fit within token limits (~8000 chars is safe for MiniLM)
    truncated_text = text[:8000]

    resumes_collection.upsert(
        ids=[candidate_id],
        documents=[truncated_text],
        metadatas=[clean_metadata] if clean_metadata else None,
    )


def search_similar_candidates(query: str, top_k: int = 5) -> list:
    """
    Semantic search across stored resumes.

    Args:
        query: Search query text (e.g., "Python developer with ML experience")
        top_k: Number of results to return

    Returns:
        List of dicts with candidate_id, distance, and metadata
    """
    if not CHROMA_AVAILABLE or not resumes_collection:
        return []
    if not query or not query.strip():
        return []

    results = resumes_collection.query(
        query_texts=[query],
        n_results=min(top_k, resumes_collection.count() or 1),
    )

    candidates = []
    if results and results["ids"] and results["ids"][0]:
        for i, cid in enumerate(results["ids"][0]):
            candidate = {
                "candidate_id": cid,
                "distance": results["distances"][0][i] if results.get("distances") else None,
                "metadata": results["metadatas"][0][i] if results.get("metadatas") else {},
            }
            candidates.append(candidate)

    return candidates


def get_collection_count() -> int:
    """Return the number of documents in the resumes collection."""
    if not CHROMA_AVAILABLE or not resumes_collection:
        return 0
    return resumes_collection.count()
