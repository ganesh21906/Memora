"""
Memora Tool – Attachment Parser
Downloads Gmail attachments and routes them to the appropriate search tool.
Only used in live Gmail mode (USE_DEMO_MODE=false).
"""
from __future__ import annotations

from typing import Any


def search_attachments(query: str) -> str:
    """
    Agent-callable tool: search Gmail email attachments for content relevant to *query*.
    Fetches emails matching the query, downloads their attachments, and searches them.
    Only works in live Gmail mode (USE_DEMO_MODE=false).
    """
    from backend.config import settings

    if settings.use_demo_mode:
        return "Attachment search is only available in live Gmail mode (USE_DEMO_MODE=false)."

    from backend.gmail_client import fetch_emails
    from backend.tools.email_search import _keywords_from_query

    keywords = _keywords_from_query(query) or query.split()
    gmail_query = " OR ".join(keywords[:5])

    try:
        emails = fetch_emails(gmail_query)
    except Exception as exc:
        return f"[Could not fetch emails for attachment search: {exc}]"

    emails_with_attachments = [e for e in emails if e.get("attachments")]
    if not emails_with_attachments:
        return "No emails with attachments found for this query."

    return parse_gmail_attachments(emails_with_attachments, query)


def parse_gmail_attachments(emails: list[dict[str, Any]], query: str) -> str:
    """
    For each email with attachments, download the attachment and search it.
    Routes PDF → pdf_search, CSV → csv_search, TXT → txt_search.
    """
    from backend.gmail_client import download_attachment
    from backend.tools.pdf_search import search_pdf
    from backend.tools.csv_search import search_csv
    from backend.tools.txt_search import search_txt

    results: list[str] = []

    for email in emails:
        attachments = email.get("attachments", [])
        for att in attachments:
            filename: str = att.get("filename", "")
            mime_type: str = att.get("mime_type", "")
            attachment_id: str = att.get("attachment_id", "")
            message_id: str = att.get("message_id", "")

            if not attachment_id:
                continue

            try:
                raw_bytes = download_attachment(message_id, attachment_id)
            except Exception as exc:
                results.append(f"[Could not download {filename}: {exc}]")
                continue

            fname_lower = filename.lower()
            mime_lower = mime_type.lower()

            if fname_lower.endswith(".pdf") or "pdf" in mime_lower:
                res = search_pdf(query, pdf_bytes=raw_bytes, filename=filename)
            elif fname_lower.endswith(".csv") or "csv" in mime_lower:
                res = search_csv(query, csv_bytes=raw_bytes, filename=filename)
            elif (
                fname_lower.endswith(".txt")
                or fname_lower.endswith(".md")
                or "text" in mime_lower
            ):
                # Write to a temp file for txt_search reuse
                import tempfile, os
                from pathlib import Path
                from backend.config import settings

                tmp_path = settings.uploads_dir / filename
                tmp_path.write_bytes(raw_bytes)
                res = search_txt(query)
                # Clean up temp file
                try:
                    tmp_path.unlink()
                except Exception:
                    pass
            else:
                continue  # Skip unsupported types

            if res and "No relevant" not in res:
                results.append(f"📎 Attachment from '{email.get('subject', '')}' → {filename}:\n{res}")

    if not results:
        return "No relevant content found in email attachments."
    return "\n\n".join(results)
