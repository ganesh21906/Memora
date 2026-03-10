"""
Memora – Document Indexer
Chunks documents and stores them in the vector store for semantic search.
Supports PDF, TXT, MD, CSV, and WhatsApp chat exports.
"""
from __future__ import annotations

import hashlib
import re
from pathlib import Path


# ── Text chunking ─────────────────────────────────────────────────────────────

def _chunk_text(text: str, chunk_size: int = 500, overlap: int = 50) -> list[str]:
    """Split text into overlapping chunks by paragraph, then sentence."""
    if not text.strip():
        return []

    paragraphs = [p.strip() for p in re.split(r"\n\s*\n", text) if p.strip()]
    chunks: list[str] = []
    current = ""

    for para in paragraphs:
        if len(current) + len(para) + 1 <= chunk_size:
            current = (current + " " + para).strip()
        else:
            if current:
                chunks.append(current)
            if len(para) > chunk_size:
                # Split long paragraph by sentence
                sentences = re.split(r"(?<=[.!?])\s+", para)
                sent_buf = ""
                for sent in sentences:
                    if len(sent_buf) + len(sent) + 1 <= chunk_size:
                        sent_buf = (sent_buf + " " + sent).strip()
                    else:
                        if sent_buf:
                            chunks.append(sent_buf)
                        sent_buf = sent[:chunk_size]
                current = sent_buf
            else:
                current = para

    if current:
        chunks.append(current)

    return [c for c in chunks if len(c.strip()) > 30]


def _make_id(source: str, idx: int) -> str:
    h = hashlib.md5(f"{source}:{idx}".encode()).hexdigest()[:8]
    return f"{h}_{idx}"


# ── Per-format indexers ───────────────────────────────────────────────────────

def index_pdf(path: Path) -> int:
    """Index a PDF — one chunk set per page. Returns chunks stored."""
    from backend.vector_store import add_chunks, delete_by_source
    import fitz  # PyMuPDF

    source = path.name
    delete_by_source(source)

    try:
        doc = fitz.open(str(path))
        all_chunks, all_metas, all_ids = [], [], []
        for page_num, page in enumerate(doc):
            for i, chunk in enumerate(_chunk_text(page.get_text())):
                idx = len(all_chunks)
                all_chunks.append(chunk)
                all_metas.append({"source": source, "type": "pdf", "page": page_num + 1})
                all_ids.append(_make_id(f"{source}_p{page_num}", i))
        doc.close()
        add_chunks(all_chunks, all_metas, all_ids)
        return len(all_chunks)
    except Exception as exc:
        import logging
        logging.getLogger(__name__).error("PDF index error %s: %s", path, exc)
        return 0


def index_txt(path: Path) -> int:
    """Index a plain text / markdown file. Auto-detects WhatsApp exports."""
    from backend.vector_store import add_chunks, delete_by_source

    source = path.name
    delete_by_source(source)

    try:
        text = path.read_text(encoding="utf-8", errors="ignore")
        # Detect WhatsApp export
        _WA = re.compile(r"^\[?\d{1,2}/\d{1,2}/\d{2,4}[,\s]")
        if _WA.search(text[:300]):
            return _index_whatsapp(source, text)

        chunks = _chunk_text(text)
        if not chunks:
            return 0
        metas = [{"source": source, "type": "txt"} for _ in chunks]
        ids = [_make_id(source, i) for i in range(len(chunks))]
        add_chunks(chunks, metas, ids)
        return len(chunks)
    except Exception as exc:
        import logging
        logging.getLogger(__name__).error("TXT index error %s: %s", path, exc)
        return 0


def _index_whatsapp(source: str, text: str) -> int:
    """Group WhatsApp messages by date and index as day-chunks."""
    from backend.vector_store import add_chunks
    from backend.tools.whatsapp_search import _parse_chat

    messages = _parse_chat(text)
    if not messages:
        return 0

    day_groups: dict[str, list[str]] = {}
    for msg in messages:
        line = f"[{msg['time']}] {msg['sender']}: {msg['message']}"
        day_groups.setdefault(msg["date"], []).append(line)

    chunks, metas, ids = [], [], []
    for i, (date, lines) in enumerate(day_groups.items()):
        chunks.append(f"Date: {date}\n" + "\n".join(lines))
        metas.append({"source": source, "type": "whatsapp", "date": date})
        ids.append(_make_id(source + "_wa", i))

    add_chunks(chunks, metas, ids)
    return len(chunks)


def index_csv(path: Path) -> int:
    """Index a CSV — groups of 10 rows per chunk."""
    from backend.vector_store import add_chunks, delete_by_source
    import pandas as pd

    source = path.name
    delete_by_source(source)

    try:
        df = pd.read_csv(path)
        chunks, metas, ids = [], [], []
        step = 10
        for start in range(0, len(df), step):
            subset = df.iloc[start : start + step]
            rows = []
            for _, row in subset.iterrows():
                rows.append(", ".join(
                    f"{col}: {val}" for col, val in row.items()
                    if str(val).strip() not in ("", "nan")
                ))
            chunk = "\n".join(rows)
            if chunk.strip():
                chunks.append(chunk)
                metas.append({"source": source, "type": "csv",
                               "rows": f"{start}-{start + len(subset) - 1}"})
                ids.append(_make_id(source, start // step))
        add_chunks(chunks, metas, ids)
        return len(chunks)
    except Exception as exc:
        import logging
        logging.getLogger(__name__).error("CSV index error %s: %s", path, exc)
        return 0


# ── Dispatcher ────────────────────────────────────────────────────────────────

def index_file(path: Path) -> int:
    """Auto-detect file type and index. Returns number of chunks stored."""
    suffix = path.suffix.lower()
    if suffix == ".pdf":
        return index_pdf(path)
    elif suffix in (".txt", ".md"):
        return index_txt(path)
    elif suffix == ".csv":
        return index_csv(path)
    return 0


def reindex_all() -> dict[str, int]:
    """Re-index all files in data/ and data/uploads/. Returns {filename: chunks}."""
    from backend.config import settings

    results: dict[str, int] = {}
    for d in [settings.data_dir, settings.uploads_dir]:
        if not d.exists():
            continue
        for f in d.iterdir():
            if f.is_file() and not f.name.startswith(".") \
                    and f.suffix.lower() in (".pdf", ".txt", ".csv", ".md"):
                results[f.name] = index_file(f)
    return results
