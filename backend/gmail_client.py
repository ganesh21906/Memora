"""
Memora – Gmail Client
Handles OAuth 2.0 authentication and Gmail API interactions.
In USE_DEMO_MODE=true this module is never called.
"""
from __future__ import annotations

import base64
import json
import os
from pathlib import Path
from typing import Any

from backend.config import settings

# Gmail API scopes
SCOPES = ["https://www.googleapis.com/auth/gmail.readonly"]


def _get_service():
    """Authenticate and return a Gmail API service object."""
    from google.auth.transport.requests import Request
    from google.oauth2.credentials import Credentials
    from google_auth_oauthlib.flow import InstalledAppFlow
    from googleapiclient.discovery import build

    creds = None
    token_path = Path(settings.gmail_token_file)
    creds_path = Path(settings.gmail_credentials_file)

    if token_path.exists():
        creds = Credentials.from_authorized_user_file(str(token_path), SCOPES)

    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            if not creds_path.exists():
                raise FileNotFoundError(
                    f"Gmail credentials file not found at '{creds_path}'. "
                    "Download it from Google Cloud Console → APIs & Services → Credentials."
                )
            flow = InstalledAppFlow.from_client_secrets_file(str(creds_path), SCOPES)
            creds = flow.run_local_server(port=0)
        token_path.parent.mkdir(parents=True, exist_ok=True)
        token_path.write_text(creds.to_json())

    return build("gmail", "v1", credentials=creds)


def _decode_body(payload: dict) -> str:
    """Recursively decode email body from MIME parts."""
    body = ""
    if payload.get("body", {}).get("data"):
        raw = payload["body"]["data"]
        body += base64.urlsafe_b64decode(raw + "==").decode("utf-8", errors="ignore")
    for part in payload.get("parts", []):
        body += _decode_body(part)
    return body


def fetch_emails(query: str, max_results: int | None = None) -> list[dict[str, Any]]:
    """
    Search Gmail and return a list of email dicts:
      {subject, sender, date, body, attachments: [{filename, mime_type, attachment_id, message_id}]}
    """
    service = _get_service()
    max_results = max_results or settings.gmail_max_results

    results = (
        service.users()
        .messages()
        .list(userId="me", q=query, maxResults=max_results)
        .execute()
    )
    messages = results.get("messages", [])
    emails: list[dict] = []

    for msg_ref in messages:
        msg = (
            service.users()
            .messages()
            .get(userId="me", id=msg_ref["id"], format="full")
            .execute()
        )
        headers = {h["name"]: h["value"] for h in msg["payload"].get("headers", [])}
        subject = headers.get("Subject", "(no subject)")
        sender = headers.get("From", "")
        date = headers.get("Date", "")
        body = _decode_body(msg["payload"])

        # Collect attachments metadata
        attachments: list[dict] = []
        for part in msg["payload"].get("parts", []):
            filename = part.get("filename", "")
            if filename:
                attachments.append(
                    {
                        "filename": filename,
                        "mime_type": part.get("mimeType", ""),
                        "attachment_id": part["body"].get("attachmentId", ""),
                        "message_id": msg_ref["id"],
                    }
                )

        emails.append(
            {
                "id": msg_ref["id"],
                "subject": subject,
                "sender": sender,
                "date": date,
                "body": body,
                "attachments": attachments,
            }
        )

    return emails


def download_attachment(message_id: str, attachment_id: str) -> bytes:
    """Download an attachment and return raw bytes."""
    service = _get_service()
    att = (
        service.users()
        .messages()
        .attachments()
        .get(userId="me", messageId=message_id, id=attachment_id)
        .execute()
    )
    data = att.get("data", "")
    return base64.urlsafe_b64decode(data + "==")


if __name__ == "__main__":
    # Quick test: run this file to trigger OAuth flow
    print("Authenticating with Gmail…")
    service = _get_service()
    print("✅ Gmail authentication successful!")
    sample = fetch_emails("subject:event", max_results=3)
    print(f"Found {len(sample)} emails.")
    for e in sample:
        print(f"  • {e['subject']} — {e['sender']}")
