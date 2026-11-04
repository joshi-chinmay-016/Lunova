import base64
from datetime import datetime, timezone
import pytest
from app.platform.integrations.gmail.message_normalizer import (
    GmailMessageNormalizer,
    NormalizedEmailMessage,
)


def test_extract_sender_info():
    addr, name = GmailMessageNormalizer.extract_sender_info("Sarah Connor <sarah@cyberdyne.com>")
    assert addr == "sarah@cyberdyne.com"
    assert name == "Sarah Connor"

    addr, name = GmailMessageNormalizer.extract_sender_info("procurement@acme.org")
    assert addr == "procurement@acme.org"
    assert name is None

    addr, name = GmailMessageNormalizer.extract_sender_info("")
    assert addr == "unknown@unknown.com"


def test_parse_date():
    # RFC 2822 date header
    d1 = GmailMessageNormalizer.parse_date("Wed, 04 Nov 2026 12:00:00 +0000")
    assert d1.year == 2026
    assert d1.month == 11
    assert d1.day == 4
    assert d1.tzinfo == timezone.utc

    # Fallback to internalDate ms
    d2 = GmailMessageNormalizer.parse_date("", "1730720000000")
    assert d2.tzinfo == timezone.utc


def test_normalize_plain_text_message():
    body = "Please provide a proposal for SOC 2 compliance consulting."
    b64_body = base64.urlsafe_b64encode(body.encode("utf-8")).decode("ascii")

    raw_msg = {
        "id": "msg_001",
        "threadId": "thread_001",
        "snippet": "Please provide a proposal...",
        "payload": {
            "headers": [
                {"name": "Subject", "value": "RFP Request - Compliance"},
                {"name": "From", "value": "client@enterprise.com"},
                {"name": "To", "value": "proposals@lunetron.com"},
                {"name": "Date", "value": "Wed, 04 Nov 2026 10:00:00 +0000"},
            ],
            "mimeType": "text/plain",
            "body": {
                "size": len(body),
                "data": b64_body,
            },
        },
    }

    norm = GmailMessageNormalizer.normalize_message(raw_msg)

    assert norm.message_id == "msg_001"
    assert norm.thread_id == "thread_001"
    assert norm.sender == "client@enterprise.com"
    assert norm.recipients == ["proposals@lunetron.com"]
    assert norm.subject == "RFP Request - Compliance"
    assert norm.body_text == body
    assert len(norm.attachments) == 0


def test_normalize_multipart_with_attachments():
    text_content = "Please review the attached RFP specifications."
    b64_text = base64.urlsafe_b64encode(text_content.encode("utf-8")).decode("ascii")

    att_bytes = b"%PDF-1.4 synthetic pdf content"
    b64_att = base64.urlsafe_b64encode(att_bytes).decode("ascii")

    raw_msg = {
        "id": "msg_002",
        "threadId": "thread_002",
        "snippet": "Please review...",
        "payload": {
            "headers": [
                {"name": "Subject", "value": "Attached Technical RFP"},
                {"name": "From", "value": "Director <director@corp.com>"},
                {"name": "To", "value": "inquiries@lunetron.com, backup@lunetron.com"},
                {"name": "Date", "value": "Wed, 04 Nov 2026 14:00:00 +0000"},
            ],
            "mimeType": "multipart/mixed",
            "parts": [
                {
                    "mimeType": "text/plain",
                    "filename": "",
                    "body": {"size": len(text_content), "data": b64_text},
                },
                {
                    "mimeType": "application/pdf",
                    "filename": "Requirements_Specification.pdf",
                    "body": {
                        "size": len(att_bytes),
                        "attachmentId": "att_pdf_1",
                        "data": b64_att,
                    },
                },
            ],
        },
    }

    norm = GmailMessageNormalizer.normalize_message(raw_msg)

    assert norm.message_id == "msg_002"
    assert norm.sender == "director@corp.com"
    assert norm.sender_name == "Director"
    assert len(norm.recipients) == 2
    assert norm.body_text == text_content
    assert len(norm.attachments) == 1

    att = norm.attachments[0]
    assert att.filename == "Requirements_Specification.pdf"
    assert att.content_type == "application/pdf"
    assert att.attachment_id == "att_pdf_1"
    assert att.data == att_bytes


def test_fallback_to_snippet_when_body_empty():
    raw_msg = {
        "id": "msg_003",
        "threadId": "thread_003",
        "snippet": "This is a snippet fallback",
        "payload": {
            "headers": [
                {"name": "Subject", "value": "Empty Body Msg"},
                {"name": "From", "value": "lead@client.com"},
            ],
            "mimeType": "text/plain",
            "body": {"size": 0, "data": ""},
        },
    }

    norm = GmailMessageNormalizer.normalize_message(raw_msg)
    assert norm.body_text == "This is a snippet fallback"
