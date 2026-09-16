# Email Architecture

This document specifies the email integration design for **Lunova**, detailing the adapter pattern that isolates core proposal workflows from external email service providers.

---

## 1. Provider-Agnostic Adapter Pattern

The proposal management engine and AI intelligence pipeline must remain completely agnostic to email providers. All raw messages are consumed and dispatched through an **Email Adapter**:

```
               ┌─────────────────────────────┐
               │    External Email Source    │
               │   (MVP: Gmail API via Dev)  │
               └──────────────┬──────────────┘
                              │
                              ▼
               ┌─────────────────────────────┐
               │   Email Adapter Interface   │  (backend/app/infrastructure/email/)
               └──────────────┬──────────────┘
                              │
                              ▼
               ┌─────────────────────────────┐
               │      Normalized Email       │  (Canonical Domain Entity)
               └──────────────┬──────────────┘
                              │
                              ▼
               ┌─────────────────────────────┐
               │   Proposal Core & AI Engine │
               └─────────────────────────────┘
```

---

## 2. Normalized Email Model

Regardless of whether an email originates from Gmail or a future provider, it is translated into a canonical domain representation before entering domain logic or contracts:

- **`message_id`**: Universal identifier for the individual message.
- **`thread_id`**: Thread identifier grouping correlated inquiries and follow-ups.
- **`sender`**: Cleaned sender email address (e.g., `procurement@client.com`).
- **`recipients`**: List of target email addresses receiving the message.
- **`subject`**: Cleaned subject line with standard prefixes stripped if needed.
- **`body`**: Normalized plain text or markdown extracted from HTML/MIME parts.
- **`received_at`**: UTC timestamp (ISO-8601) of original email dispatch.
- **`attachments`**: Extracted attachment metadata and raw binary/content handles.

---

## 3. Provider Roadmap

| Provider | Status | Description |
| :--- | :--- | :--- |
| **Gmail API** | MVP | Ingestion from our dedicated development mailbox using Google API client. |
| **Microsoft Outlook / Graph API** | Future | Enterprise Outlook 365 and Exchange integration for client onboarding. |
| **IMAP / SMTP** | Future | Generic mail protocol fallback for custom client servers. |

> [!IMPORTANT]
> **RULE 3: The AI engine must NOT depend directly on Gmail.**
> Neither the AI Intelligence module (`backend/intelligence/`) nor contracts (`contracts/`) may import or reference Gmail SDK types, OAuth tokens, or Google message IDs. The AI receives strictly normalized data.
