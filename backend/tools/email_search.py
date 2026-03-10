"""
Memora Tool – Search Email
Searches Gmail (live mode) or sample JSON data (demo mode).
"""
from __future__ import annotations

import json
import re
from pathlib import Path
from typing import Any

from backend.config import settings


# ── Helpers ──────────────────────────────────────────────────────────────────

def _load_demo_emails() -> list[dict[str, Any]]:
    path = settings.data_dir / "sample_emails.json"
    if not path.exists():
        return []
    return json.loads(path.read_text(encoding="utf-8"))


def _score_email(email: dict, keywords: list[str]) -> int:
    """Return how many keywords appear in subject + body (case-insensitive)."""
    haystack = (
        (email.get("subject", "") + " " + email.get("body", "")).lower()
    )
    return sum(1 for kw in keywords if kw.lower() in haystack)


def _format_email(email: dict) -> str:
    lines = [
        f"📧 Subject : {email.get('subject', '(no subject)')}",
        f"   From    : {email.get('sender', '')}",
        f"   Date    : {email.get('date', '')}",
        f"   Body    : {email.get('body', '')[:600].strip()}",
    ]
    attachments = email.get("attachments", [])
    if attachments:
        att_names = ", ".join(a.get("filename", "") for a in attachments)
        lines.append(f"   Attachments: {att_names}")
    return "\n".join(lines)


def _keywords_from_query(query: str) -> list[str]:
    """Extract meaningful words (>3 chars) from the query."""
    stop = {"what", "when", "where", "which", "about", "were", "have", "that",
            "with", "from", "this", "there", "they", "some", "tell", "find",
            "show", "give", "remind", "did", "was", "are", "the", "for", "and"}
    words = re.findall(r"[a-zA-Z]+", query.lower())
    return [w for w in words if len(w) > 3 and w not in stop]


# ── Public tool function ──────────────────────────────────────────────────────

def search_email(query: str) -> str:
    """
    Search emails for information relevant to *query*.

    Returns formatted snippets from the most relevant emails.
    In demo mode reads sample_emails.json; in live mode calls Gmail API.
    """
    keywords = _keywords_from_query(query)
    if not keywords:
        keywords = query.split()

    if settings.use_demo_mode:
        emails = _load_demo_emails()
    else:
        from backend.gmail_client import fetch_emails
        # Build a simple Gmail search query from keywords
        gmail_query = " OR ".join(keywords[:5])
        emails = fetch_emails(gmail_query)

    if not emails:
        return "No emails found."

    # Score and rank
    scored = [(e, _score_email(e, keywords)) for e in emails]
    scored.sort(key=lambda x: x[1], reverse=True)
    top = [e for e, score in scored if score > 0][:5]

    if not top:
        top = [emails[0]]  # fallback: return first email

    result_parts = [f"Found {len(top)} relevant email(s):\n"]
    for email in top:
        result_parts.append(_format_email(email))
        result_parts.append("─" * 60)

    return "\n".join(result_parts)
