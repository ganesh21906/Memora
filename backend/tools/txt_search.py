"""
Memora Tool – Search TXT
Searches plain-text files (.txt, .md) for relevant content.
Uses semantic vector search (ChromaDB) with keyword fallback.
"""
from __future__ import annotations

from pathlib import Path

from backend.config import settings


def _score_line(line: str, keywords: list[str]) -> bool:
    line_l = line.lower()
    return any(kw.lower() in line_l for kw in keywords)


def search_txt(query: str) -> str:
    """
    Search all TXT/Markdown files for *query*.
    Uses semantic vector search first, falls back to keyword line matching.
    """
    from backend.tools.email_search import _keywords_from_query
    from backend.vector_store import search, is_available

    keywords = _keywords_from_query(query) or query.split()
    results: list[str] = []

    # ── Semantic vector search ────────────────────────────────────────────────
    if is_available():
        hits = search(query, n_results=6, where={"type": "txt"})
        if hits:
            for hit in hits:
                src = hit["metadata"].get("source", "unknown")
                results.append(f"📝 {src}:\n{hit['text']}")
            return "\n\n".join(results)

    # ── Keyword fallback ──────────────────────────────────────────────────────
    for d in [settings.data_dir, settings.uploads_dir]:
        if not d.exists():
            continue
        for txt_path in list(d.glob("*.txt")) + list(d.glob("*.md")):
            lines = txt_path.read_text(encoding="utf-8", errors="ignore").splitlines()
            file_hits: list[str] = []
            reported: set[int] = set()
            for i, line in enumerate(lines):
                if _score_line(line, keywords) and i not in reported:
                    ctx_start = max(0, i - 2)
                    ctx_end = min(len(lines), i + 3)
                    file_hits.append(
                        f"  [line {ctx_start + 1}–{ctx_end}]:\n"
                        + "\n".join(f"    {l}" for l in lines[ctx_start:ctx_end])
                    )
                    reported.update(range(ctx_start, ctx_end))
            if file_hits:
                results.append(f"📝 {txt_path.name}:\n" + "\n".join(file_hits[:6]))

    return "\n\n".join(results) if results else "No relevant content found in text files."
