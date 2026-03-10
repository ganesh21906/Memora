"""
Memora Tool – WhatsApp Chat Search
Parses exported WhatsApp .txt chat files and searches for relevant messages.

How to export from WhatsApp:
  Open chat → ⋮ (More) → Export chat → Without media → save as .txt
  Then upload via Memora's Upload Documents panel.
"""
from __future__ import annotations

import re
from pathlib import Path

from backend.config import settings

# Match both common WhatsApp export formats:
# [12/03/2024, 10:30:00 AM] Sender: message   (iOS / newer Android)
# 12/03/2024, 10:30 - Sender: message          (older Android)
_PATTERN_BRACKETS = re.compile(
    r"^\[(\d{1,2}/\d{1,2}/\d{2,4}),\s*(\d{1,2}:\d{2}(?::\d{2})?(?:\s*[AP]M)?)\]\s*([^:]+):\s*(.+)$"
)
_PATTERN_DASH = re.compile(
    r"^(\d{1,2}/\d{1,2}/\d{2,4}),\s*(\d{1,2}:\d{2}(?:\s*[AP]M)?)\s*-\s*([^:]+):\s*(.+)$"
)

# Lines that are system notifications, not real messages
_SYSTEM_PHRASES = (
    "messages and calls are end-to-end encrypted",
    "created group",
    "added you",
    "changed the subject",
    "changed this group",
    "left",
    "was added",
    "joined using this group",
    "changed their phone number",
    "deleted this message",
    "this message was deleted",
    "missed voice call",
    "missed video call",
    "<media omitted>",
    "image omitted",
    "video omitted",
    "audio omitted",
    "document omitted",
    "sticker omitted",
    "gif omitted",
)


def _parse_chat(text: str) -> list[dict]:
    """Parse raw WhatsApp export text into a list of message dicts."""
    messages: list[dict] = []
    current: dict | None = None

    for line in text.splitlines():
        line = line.strip()
        if not line:
            continue

        # Try to match a new message line
        m = _PATTERN_BRACKETS.match(line) or _PATTERN_DASH.match(line)
        if m:
            if current:
                messages.append(current)
            date, time_, sender, body = m.group(1), m.group(2), m.group(3).strip(), m.group(4).strip()
            # Skip system messages
            if any(phrase in body.lower() for phrase in _SYSTEM_PHRASES):
                current = None
                continue
            current = {"date": date, "time": time_, "sender": sender, "message": body}
        else:
            # Continuation of previous message (multi-line)
            if current:
                current["message"] += "\n" + line

    if current:
        messages.append(current)

    return messages


def _keywords_from_query(query: str) -> list[str]:
    stopwords = {"the", "a", "an", "is", "are", "was", "were", "in", "on",
                 "at", "to", "for", "of", "and", "or", "about", "what",
                 "when", "where", "who", "how", "did", "do", "does", "any"}
    return [w.lower() for w in query.split() if w.lower() not in stopwords and len(w) > 2]


def search_whatsapp(query: str) -> str:
    """
    Search WhatsApp exported chat files for messages relevant to *query*.
    Uses semantic vector search first, falls back to keyword matching.
    """
    from backend.vector_store import search, is_available

    results: list[str] = []

    # ── Semantic vector search ────────────────────────────────────────────────
    if is_available():
        hits = search(query, n_results=8, where={"type": "whatsapp"})
        if hits:
            for hit in hits:
                src = hit["metadata"].get("source", "unknown")
                date = hit["metadata"].get("date", "")
                label = f" ({date})" if date else ""
                results.append(f"💬 WhatsApp — {src}{label}:\n{hit['text']}")
            return "\n\n".join(results)

    # ── Keyword fallback ──────────────────────────────────────────────────────
    keywords = _keywords_from_query(query) or query.split()

    for d in [settings.data_dir, settings.uploads_dir]:
        if not d.exists():
            continue
        for txt_path in d.glob("*.txt"):
            try:
                text = txt_path.read_text(encoding="utf-8", errors="ignore")
            except Exception:
                continue
            if not (_PATTERN_BRACKETS.search(text) or _PATTERN_DASH.search(text)):
                continue
            messages = _parse_chat(text)
            matched = [
                m for m in messages
                if any(kw in m["message"].lower() for kw in keywords)
            ]
            if not matched:
                continue
            lines = [
                f"  [{m['date']} {m['time']}] {m['sender']}: {m['message']}"
                for m in matched[:20]
            ]
            results.append(
                f"💬 WhatsApp — {txt_path.name} ({len(messages)} msgs, {len(matched)} matched):\n"
                + "\n".join(lines)
            )

    if not results:
        return (
            "No relevant WhatsApp messages found. "
            "Export a chat: WhatsApp → Chat → ⋮ → Export chat → Without media, "
            "then upload the .txt file via the Upload panel."
        )
    return "\n\n".join(results)
