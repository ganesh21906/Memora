"""
Memora Tool – Search PDF
Extracts text from PDF files and searches for relevant content.
Uses semantic vector search (ChromaDB) with keyword fallback.
"""
from __future__ import annotations

from pathlib import Path

from backend.config import settings


def _extract_text_from_bytes(pdf_bytes: bytes) -> str:
    try:
        import fitz
        doc = fitz.open(stream=pdf_bytes, filetype="pdf")
        pages = [page.get_text() for page in doc]
        doc.close()
        return "\n".join(pages)
    except Exception as exc:
        return f"[PDF parse error: {exc}]"


def _extract_text_from_file(path: Path) -> str:
    return _extract_text_from_bytes(path.read_bytes())


def _find_relevant_chunks(text: str, keywords: list[str], context: int = 300) -> list[str]:
    """Keyword fallback: return snippets containing any keyword."""
    chunks: list[str] = []
    text_lower = text.lower()
    found_positions: set[int] = set()
    for kw in keywords:
        start = 0
        kw_lower = kw.lower()
        while True:
            pos = text_lower.find(kw_lower, start)
            if pos == -1:
                break
            window_start = max(0, pos - context)
            if any(abs(p - window_start) < context for p in found_positions):
                start = pos + 1
                continue
            found_positions.add(window_start)
            chunks.append(f"…{text[window_start: pos + context].strip()}…")
            start = pos + 1
    return chunks[:8]


def search_pdf(query: str, pdf_bytes: bytes | None = None, filename: str = "") -> str:
    """
    Search PDF content for *query*.
    Uses semantic vector search first, falls back to keyword search.
    If *pdf_bytes* is provided (Gmail attachment), searches that PDF directly.
    """
    from backend.tools.email_search import _keywords_from_query
    from backend.vector_store import search, is_available

    keywords = _keywords_from_query(query) or query.split()
    results: list[str] = []

    # ── Inline bytes (Gmail attachment — always keyword) ─────────────────────
    if pdf_bytes:
        chunks = _find_relevant_chunks(_extract_text_from_bytes(pdf_bytes), keywords)
        if chunks:
            results.append(f"📄 PDF ({filename or 'attachment'}):\n" + "\n".join(chunks))

    # ── Semantic vector search ────────────────────────────────────────────────
    if is_available():
        hits = search(query, n_results=6, where={"type": "pdf"})
        if hits:
            for hit in hits:
                src = hit["metadata"].get("source", "unknown")
                page = hit["metadata"].get("page", "")
                label = f" (page {page})" if page else ""
                results.append(f"📄 {src}{label}:\n{hit['text']}")
            return "\n\n".join(results) if results else "No relevant content found in PDF files."

    # ── Keyword fallback ──────────────────────────────────────────────────────
    for d in [settings.uploads_dir, settings.data_dir]:
        if not d.exists():
            continue
        for pdf_path in d.glob("*.pdf"):
            chunks = _find_relevant_chunks(_extract_text_from_file(pdf_path), keywords)
            if chunks:
                results.append(f"📄 {pdf_path.name}:\n" + "\n".join(chunks))

    return "\n\n".join(results) if results else "No relevant content found in PDF files."
