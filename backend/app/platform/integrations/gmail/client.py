import abc
import base64
from typing import Any, Dict, List, Optional
import httpx


class BaseGmailClient(abc.ABC):
    """Abstract interface for interacting with Gmail API."""

    @abc.abstractmethod
    def list_messages(self, query: str = "label:INBOX", max_results: int = 20) -> List[Dict[str, Any]]:
        """Lists message stubs matching query."""
        pass

    @abc.abstractmethod
    def get_message(self, message_id: str) -> Dict[str, Any]:
        """Retrieves full message payload for message_id."""
        pass

    @abc.abstractmethod
    def get_attachment(self, message_id: str, attachment_id: str) -> bytes:
        """Retrieves raw bytes for an attachment."""
        pass

    @abc.abstractmethod
    def send_message(self, raw_email_bytes: bytes, thread_id: Optional[str] = None) -> Dict[str, Any]:
        """Dispatches an RFC 2822 email message via Gmail."""
        pass


class GmailClient(BaseGmailClient):
    """Production Gmail client communicating directly with Google Gmail API v1 using httpx."""

    GMAIL_API_BASE = "https://gmail.googleapis.com/gmail/v1/users/me"

    def __init__(self, access_token: str, client: Optional[httpx.Client] = None):
        self.access_token = access_token
        self._client = client or httpx.Client(timeout=30.0)

    def _get_headers(self) -> Dict[str, str]:
        return {
            "Authorization": f"Bearer {self.access_token}",
            "Accept": "application/json",
        }

    def list_messages(self, query: str = "label:INBOX", max_results: int = 20) -> List[Dict[str, Any]]:
        url = f"{self.GMAIL_API_BASE}/messages"
        params = {"q": query, "maxResults": max_results}
        res = self._client.get(url, headers=self._get_headers(), params=params)
        if res.status_code == 401:
            raise ValueError("Gmail access token has expired.")
        if not res.is_success:
            raise RuntimeError(f"Gmail API list_messages error ({res.status_code}): {res.text}")
        data = res.json()
        return data.get("messages", [])

    def get_message(self, message_id: str) -> Dict[str, Any]:
        url = f"{self.GMAIL_API_BASE}/messages/{message_id}"
        params = {"format": "full"}
        res = self._client.get(url, headers=self._get_headers(), params=params)
        if not res.is_success:
            raise RuntimeError(f"Gmail API get_message error ({res.status_code}): {res.text}")
        return res.json()

    def get_attachment(self, message_id: str, attachment_id: str) -> bytes:
        url = f"{self.GMAIL_API_BASE}/messages/{message_id}/attachments/{attachment_id}"
        res = self._client.get(url, headers=self._get_headers())
        if not res.is_success:
            raise RuntimeError(f"Gmail API get_attachment error ({res.status_code}): {res.text}")
        data = res.json()
        raw_b64 = data.get("data", "")
        # Standardize and decode base64url
        padded = raw_b64.replace("-", "+").replace("_", "/")
        padding_needed = (4 - len(padded) % 4) % 4
        padded += "=" * padding_needed
        return base64.b64decode(padded)

    def send_message(self, raw_email_bytes: bytes, thread_id: Optional[str] = None) -> Dict[str, Any]:
        url = f"{self.GMAIL_API_BASE}/messages/send"
        b64_raw = base64.urlsafe_b64encode(raw_email_bytes).decode("ascii")
        payload: Dict[str, Any] = {"raw": b64_raw}
        if thread_id:
            payload["threadId"] = thread_id

        res = self._client.post(url, headers=self._get_headers(), json=payload)
        if not res.is_success:
            raise RuntimeError(f"Gmail API send_message error ({res.status_code}): {res.text}")
        return res.json()


class MockGmailClient(BaseGmailClient):
    """Deterministic in-memory mock Gmail client for automated testing and offline development."""

    def __init__(self, initial_messages: Optional[List[Dict[str, Any]]] = None):
        self.messages: Dict[str, Dict[str, Any]] = {}
        self.attachments: Dict[str, bytes] = {}
        self.sent_messages: List[Dict[str, Any]] = []

        if initial_messages:
            for msg in initial_messages:
                msg_id = msg.get("id", f"msg_{len(self.messages) + 1}")
                self.messages[msg_id] = msg

    def add_message(
        self,
        message_id: str,
        sender: str,
        subject: str,
        body_text: str,
        thread_id: Optional[str] = None,
        attachments: Optional[List[Dict[str, Any]]] = None,
    ) -> None:
        """Helper to inject a synthetic message into mock store."""
        t_id = thread_id or f"thread_{message_id}"
        parts = [
            {
                "mimeType": "text/plain",
                "filename": "",
                "body": {
                    "size": len(body_text),
                    "data": base64.urlsafe_b64encode(body_text.encode("utf-8")).decode("ascii"),
                },
            }
        ]

        if attachments:
            for att in attachments:
                att_id = att.get("id", f"att_{len(self.attachments) + 1}")
                data_bytes = att.get("data", b"mock binary data")
                self.attachments[att_id] = data_bytes
                parts.append(
                    {
                        "mimeType": att.get("content_type", "application/pdf"),
                        "filename": att.get("filename", "sample.pdf"),
                        "body": {
                            "attachmentId": att_id,
                            "size": len(data_bytes),
                        },
                    }
                )

        raw_msg = {
            "id": message_id,
            "threadId": t_id,
            "labelIds": ["INBOX"],
            "snippet": body_text[:100],
            "internalDate": "1730720000000",
            "payload": {
                "headers": [
                    {"name": "Subject", "value": subject},
                    {"name": "From", "value": sender},
                    {"name": "To", "value": "proposals@lunetron.com"},
                    {"name": "Date", "value": "Wed, 04 Nov 2026 12:00:00 +0000"},
                ],
                "mimeType": "multipart/mixed",
                "parts": parts,
            },
        }
        self.messages[message_id] = raw_msg

    def list_messages(self, query: str = "label:INBOX", max_results: int = 20) -> List[Dict[str, Any]]:
        return [{"id": m_id, "threadId": msg.get("threadId")} for m_id, msg in list(self.messages.items())[:max_results]]

    def get_message(self, message_id: str) -> Dict[str, Any]:
        if message_id not in self.messages:
            raise KeyError(f"Mock message not found: {message_id}")
        return self.messages[message_id]

    def get_attachment(self, message_id: str, attachment_id: str) -> bytes:
        if attachment_id not in self.attachments:
            raise KeyError(f"Mock attachment not found: {attachment_id}")
        return self.attachments[attachment_id]

    def send_message(self, raw_email_bytes: bytes, thread_id: Optional[str] = None) -> Dict[str, Any]:
        sent_id = f"sent_{len(self.sent_messages) + 1}"
        record = {
            "id": sent_id,
            "threadId": thread_id or f"thread_{sent_id}",
            "raw_bytes": raw_email_bytes,
        }
        self.sent_messages.append(record)
        return {"id": sent_id, "threadId": record["threadId"], "labelIds": ["SENT"]}

