import base64
import email.utils
import re
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional


@dataclass
class NormalizedAttachmentMetadata:
    """Metadata describing an attachment discovered inside a Gmail message."""

    filename: str
    content_type: str
    size_bytes: int
    attachment_id: Optional[str] = None
    data: Optional[bytes] = None


@dataclass
class NormalizedEmailMessage:
    """Normalized, provider-independent representation of an email message."""

    message_id: str
    thread_id: str
    sender: str
    sender_name: Optional[str]
    recipients: List[str]
    subject: str
    body_text: str
    body_html: Optional[str]
    received_at: datetime
    attachments: List[NormalizedAttachmentMetadata] = field(default_factory=list)
    raw_snippet: Optional[str] = None


class GmailMessageNormalizer:
    """Parses raw Gmail API message dictionaries into clean, typed NormalizedEmailMessage objects."""

    @staticmethod
    def _decode_base64url(data_str: str) -> str:
        """Safely decodes base64url-encoded string from Gmail API."""
        if not data_str:
            return ""
        # Standardize base64url characters to standard base64
        padded = data_str.replace("-", "+").replace("_", "/")
        # Add required padding
        padding_needed = (4 - len(padded) % 4) % 4
        padded += "=" * padding_needed
        try:
            raw_bytes = base64.b64decode(padded)
            return raw_bytes.decode("utf-8", errors="replace")
        except Exception:
            return ""

    @staticmethod
    def _decode_base64url_bytes(data_str: str) -> bytes:
        """Safely decodes base64url-encoded data directly to bytes."""
        if not data_str:
            return b""
        padded = data_str.replace("-", "+").replace("_", "/")
        padding_needed = (4 - len(padded) % 4) % 4
        padded += "=" * padding_needed
        try:
            return base64.b64decode(padded)
        except Exception:
            return b""

    @classmethod
    def extract_sender_info(cls, from_header: str) -> tuple[str, Optional[str]]:
        """Extracts email address and display name from From header."""
        if not from_header:
            return "unknown@unknown.com", None
        name, address = email.utils.parseaddr(from_header)
        clean_address = address.strip() if address else from_header.strip()
        clean_name = name.strip() if name else None
        return clean_address, clean_name

    @classmethod
    def parse_header(cls, headers: List[Dict[str, str]], header_name: str) -> str:
        """Retrieves a header value by name case-insensitively."""
        target = header_name.lower()
        for h in headers:
            if h.get("name", "").lower() == target:
                return h.get("value", "")
        return ""

    @classmethod
    def parse_date(cls, date_str: str, internal_date_ms: Optional[str] = None) -> datetime:
        """Parses email Date header or internal timestamp into a UTC datetime."""
        if date_str:
            try:
                parsed_tuple = email.utils.parsedate_to_datetime(date_str)
                if parsed_tuple:
                    return parsed_tuple.astimezone(timezone.utc)
            except Exception:
                pass

        if internal_date_ms:
            try:
                ms = int(internal_date_ms)
                return datetime.fromtimestamp(ms / 1000.0, tz=timezone.utc)
            except Exception:
                pass

        return datetime.now(timezone.utc)

    @classmethod
    def _extract_parts(
        cls,
        payload: Dict[str, Any],
        text_parts: List[str],
        html_parts: List[str],
        attachments: List[NormalizedAttachmentMetadata],
    ) -> None:
        """Recursively walks message payload parts to extract body text, HTML, and attachments."""
        mime_type = payload.get("mimeType", "").lower()
        filename = payload.get("filename", "")
        body_info = payload.get("body", {})
        attachment_id = body_info.get("attachmentId")
        size = body_info.get("size", 0)
        inline_data = body_info.get("data")

        # Attachment detected if filename is non-empty or body has attachmentId
        if filename or attachment_id:
            raw_data = cls._decode_base64url_bytes(inline_data) if inline_data else None
            attachments.append(
                NormalizedAttachmentMetadata(
                    filename=filename or f"attachment_{len(attachments) + 1}",
                    content_type=mime_type or "application/octet-stream",
                    size_bytes=size or (len(raw_data) if raw_data else 0),
                    attachment_id=attachment_id,
                    data=raw_data,
                )
            )
            return

        # Plain text body
        if mime_type == "text/plain" and inline_data:
            decoded = cls._decode_base64url(inline_data)
            if decoded:
                text_parts.append(decoded)

        # HTML body
        elif mime_type == "text/html" and inline_data:
            decoded = cls._decode_base64url(inline_data)
            if decoded:
                html_parts.append(decoded)

        # Recurse through sub-parts if multipart
        parts = payload.get("parts", [])
        for sub_part in parts:
            cls._extract_parts(sub_part, text_parts, html_parts, attachments)

    @classmethod
    def normalize_message(cls, raw_msg: Dict[str, Any]) -> NormalizedEmailMessage:
        """Normalizes a raw Gmail message dict into NormalizedEmailMessage."""
        message_id = raw_msg.get("id", "")
        thread_id = raw_msg.get("threadId", "")
        payload = raw_msg.get("payload", {})
        headers = payload.get("headers", [])

        # Header fields
        subject = cls.parse_header(headers, "Subject") or "No Subject"
        from_hdr = cls.parse_header(headers, "From")
        sender_address, sender_name = cls.extract_sender_info(from_hdr)
        to_hdr = cls.parse_header(headers, "To")
        recipients = [r.strip() for r in to_hdr.split(",") if r.strip()] if to_hdr else []

        date_hdr = cls.parse_header(headers, "Date")
        received_at = cls.parse_date(date_hdr, raw_msg.get("internalDate"))

        # Extract text, html, and attachments
        text_parts: List[str] = []
        html_parts: List[str] = []
        attachments: List[NormalizedAttachmentMetadata] = []

        cls._extract_parts(payload, text_parts, html_parts, attachments)

        body_text = "\n\n".join(text_parts).strip()
        body_html = "\n\n".join(html_parts).strip() if html_parts else None

        # Fallback to snippet if body text is completely empty
        if not body_text:
            body_text = raw_msg.get("snippet", "").strip()

        return NormalizedEmailMessage(
            message_id=message_id,
            thread_id=thread_id,
            sender=sender_address,
            sender_name=sender_name,
            recipients=recipients,
            subject=subject,
            body_text=body_text,
            body_html=body_html,
            received_at=received_at,
            attachments=attachments,
            raw_snippet=raw_msg.get("snippet"),
        )

