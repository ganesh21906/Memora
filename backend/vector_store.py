"""
Memora – Vector Store
ChromaDB-based semantic search. Falls back gracefully to keyword search
if ChromaDB is unavailable (e.g. Python version incompatibility).
"""
from __future__ import annotations

import logging
from typing import Any

logger = logging.getLogger(__name__)

_collection = None
_available: bool | None = None  # None = unchecked


def _init() -> bool:
    """Try to initialize ChromaDB. Returns True on success."""
    global _collection, _available
    if _available is not None:
        return _available

    try:
        import chromadb
        from backend.config import settings

        chroma_path = settings.data_dir / "chroma"
        chroma_path.mkdir(parents=True, exist_ok=True)

        client = chromadb.PersistentClient(path=str(chroma_path))
        _collection = client.get_or_create_collection(
            name="memora",
            metadata={"hnsw:space": "cosine"},
        )
        _available = True
        logger.info("ChromaDB initialized. Chunks stored: %d", _collection.count())
    except Exception as exc:
        logger.warning("ChromaDB unavailable — falling back to keyword search: %s", exc)
        _available = False

    return _available


def is_available() -> bool:
    return _init()


def add_chunks(chunks: list[str], metadatas: list[dict], ids: list[str]) -> None:
    """Embed and store text chunks."""
    if not _init() or not chunks:
        return
    try:
        batch = 100
        for i in range(0, len(chunks), batch):
            _collection.upsert(
                documents=chunks[i : i + batch],
                metadatas=metadatas[i : i + batch],
                ids=ids[i : i + batch],
            )
    except Exception as exc:
        logger.error("Error adding chunks: %s", exc)


def search(query: str, n_results: int = 8, where: dict | None = None) -> list[dict[str, Any]]:
    """
    Semantic similarity search.
    Returns list of {text, metadata, distance} sorted by relevance.
    Returns [] if ChromaDB is unavailable or has no data.
    """
    if not _init():
        return []
    total = _collection.count()
    if total == 0:
        return []
    try:
        kwargs: dict[str, Any] = {
            "query_texts": [query],
            "n_results": min(n_results, total),
        }
        if where:
            kwargs["where"] = where
        results = _collection.query(**kwargs)
        docs = results.get("documents", [[]])[0]
        metas = results.get("metadatas", [[]])[0]
        distances = results.get("distances", [[]])[0]
        return [
            {"text": doc, "metadata": meta, "distance": dist}
            for doc, meta, dist in zip(docs, metas, distances)
        ]
    except Exception as exc:
        logger.error("Vector search error: %s", exc)
        return []


def delete_by_source(source: str) -> None:
    """Remove all chunks belonging to a source file."""
    if not _init():
        return
    try:
        _collection.delete(where={"source": source})
    except Exception as exc:
        logger.error("Error deleting source %s: %s", source, exc)


def count() -> int:
    if not _init():
        return 0
    try:
        return _collection.count()
    except Exception:
        return 0
