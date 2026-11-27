import asyncio
import logging
import time
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Dict, List, Optional
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.attachment import EmailAttachment
from app.models.audit import AuditLog
from app.models.email import Email, EmailDirection
from app.models.email_account import EmailAccount
from app.models.proposal import Proposal, ProposalStatus
from app.platform.integrations.gmail.client import BaseGmailClient, GmailClient
from app.platform.integrations.gmail.message_normalizer import (
    GmailMessageNormalizer,
    NormalizedEmailMessage,
)
from app.platform.services.attachment_storage import AttachmentStorageService
from app.platform.services.email_classifier import EmailClassifier, EmailClassification
from app.platform.services.gmail_oauth_service import GmailOAuthService
from intelligence.document_processing.parser import AttachmentParser, DocumentParseStatus

logger = logging.getLogger(__name__)


@dataclass
class GmailSyncResult:
    """Summary of completed Gmail mailbox synchronization."""

    account_id: str
    email_address: str
    new_emails_count: int
    proposals_created_count: int
    skipped_duplicates_count: int
    synced_at: str
    messages_examined: int = 0
    attachments_discovered_count: int = 0
    failed_messages_count: int = 0
    sync_status: str = "COMPLETED"
    history_id: Optional[str] = None
    sync_strategy: str = "history"
    durations: Optional[dict] = None


AUTOMATED_SENDERS = (
    "no-reply@",
    "noreply@",
    "mailer-daemon@",
    "postmaster@",
    "notifications@",
    "notification@",
    "donotreply@",
    "bounce@",
)

AUTOMATED_SUBJECT_PREFIXES = (
    "automatic reply:",
    "auto reply:",
    "out of office:",
    "undelivered mail",
    "delivery status notification",
    "invitation:",
    "accepted:",
    "declined:",
)

MAX_ATTACHMENT_SIZE = 25 * 1024 * 1024  # 25 MB


class GmailSyncService:
    """Orchestrates manual synchronization of incoming emails from a connected Gmail account."""

    # In-memory per-tenant synchronization locks to prevent concurrent duplicate syncs
    _sync_locks: Dict[UUID, asyncio.Lock] = {}

    @classmethod
    def is_automated_or_noise(cls, sender: str, subject: str) -> bool:
        """Heuristic check to identify automated notifications, bounces, or calendar invites."""
        result = EmailClassifier.classify(
            sender=sender,
            recipient="",
            subject=subject,
            body="",
        )
        return not result.is_actionable

    @classmethod
    async def get_authenticated_client(
        cls,
        db: AsyncSession,
        account: EmailAccount,
    ) -> BaseGmailClient:
        """Retrieves an authenticated Gmail API client with guaranteed fresh, valid token."""
        valid_access_token = await GmailOAuthService.get_valid_access_token(db, account)
        return GmailClient(access_token=valid_access_token)

    @classmethod
    async def sync_company_inbox(
        cls,
        db: AsyncSession,
        company_id: UUID,
        max_messages: int = 10,
        custom_client: Optional[BaseGmailClient] = None,
        attachment_storage: Optional[AttachmentStorageService] = None,
    ) -> tuple[GmailSyncResult, List[UUID]]:
        """Synchronizes incoming messages for the company tenant.
        Returns the sync summary and list of created proposal IDs eligible for background processing.
        """
        # Concurrency protection: prevent simultaneous syncs for the same company
        if company_id not in cls._sync_locks:
            cls._sync_locks[company_id] = asyncio.Lock()
        lock = cls._sync_locks[company_id]

        if lock.locked():
            raise ValueError("Inbox synchronization is already in progress for this workspace.")

        async with lock:
            start_total = time.perf_counter()
            gmail_api_fetch_duration = 0.0
            message_normalization_duration = 0.0
            db_persistence_duration = 0.0
            attachment_processing_duration = 0.0
            document_extraction_duration = 0.0

            # 1. Retrieve active email account for tenant
            db_acc_start = time.perf_counter()
            account = await GmailOAuthService.get_company_email_account(db, company_id)
            db_persistence_duration += (time.perf_counter() - db_acc_start) * 1000

            if not account or not account.is_active:
                raise ValueError("No active Gmail account connected for this company.")

            # 2. Get client & helpers
            client = custom_client or await cls.get_authenticated_client(db, account)
            storage = attachment_storage or AttachmentStorageService()
            parser = AttachmentParser(max_bytes=MAX_ATTACHMENT_SIZE)

            # 3. Retrieve messages using incremental history or full scan
            message_stubs: List[dict] = []
            sync_strategy = "full_scan"
            latest_history_id = account.history_id

            if account.history_id:
                try:
                    hist_start = time.perf_counter()
                    history_resp = await asyncio.to_thread(
                        client.list_history,
                        start_history_id=account.history_id,
                        max_results=max(max_messages * 5, 50),
                    )
                    gmail_api_fetch_duration += (time.perf_counter() - hist_start) * 1000

                    history_records = history_resp.get("history", [])
                    stubs = []
                    seen_ids = set()
                    for rec in history_records:
                        for added in rec.get("messagesAdded", []):
                            msg_item = added.get("message", {})
                            m_id = msg_item.get("id")
                            if m_id and m_id not in seen_ids:
                                labels = msg_item.get("labelIds", [])
                                if not labels or "INBOX" in labels:
                                    seen_ids.add(m_id)
                                    stubs.append({"id": m_id, "threadId": msg_item.get("threadId")})

                    message_stubs = stubs[:max_messages]
                    latest_history_id = str(history_resp.get("historyId") or account.history_id)
                    sync_strategy = "history"
                    logger.info(
                        "Incremental history sync retrieved %d message stub(s) since history_id=%s",
                        len(message_stubs),
                        account.history_id,
                    )
                except (ValueError, RuntimeError) as exc:
                    logger.info(
                        "History ID %s expired or invalid (%s). Falling back to full inbox scan.",
                        account.history_id,
                        exc,
                    )
                    sync_strategy = "fallback_full_scan"

            if not message_stubs and sync_strategy != "history":
                try:
                    list_start = time.perf_counter()
                    message_stubs = await asyncio.to_thread(
                        client.list_messages,
                        query="label:INBOX",
                        max_results=max_messages,
                    )
                    gmail_api_fetch_duration += (time.perf_counter() - list_start) * 1000
                except Exception as exc:
                    logger.error(f"Failed to query Gmail messages for company {company_id}: {exc}")
                    raise RuntimeError(f"Gmail sync failed: {str(exc)}") from exc

            messages_examined = 0
            new_emails = 0
            new_proposals = 0
            skipped_dupes = 0
            attachments_discovered = 0
            failed_messages = 0
            created_proposal_ids: List[UUID] = []

            for stub in message_stubs:
                messages_examined += 1
                msg_id = stub.get("id")
                if not msg_id:
                    continue

                # Idempotency check: verify message has not already been ingested
                db_check_start = time.perf_counter()
                stmt = select(Email).filter(
                    Email.company_id == company_id,
                    Email.message_id == msg_id,
                )
                existing_res = await db.execute(stmt)
                scalars_res = existing_res.scalars() if hasattr(existing_res, "scalars") else None
                existing = None
                if scalars_res is not None:
                    if hasattr(scalars_res, "first"):
                        existing = scalars_res.first()
                    elif hasattr(scalars_res, "all"):
                        items = scalars_res.all()
                        existing = items[0] if items else None
                db_persistence_duration += (time.perf_counter() - db_check_start) * 1000

                if existing:
                    skipped_dupes += 1
                    continue

                # Retrieve full message via threadpool
                try:
                    msg_fetch_start = time.perf_counter()
                    raw_msg = await asyncio.to_thread(client.get_message, msg_id)
                    gmail_api_fetch_duration += (time.perf_counter() - msg_fetch_start) * 1000

                    norm_start = time.perf_counter()
                    norm: NormalizedEmailMessage = GmailMessageNormalizer.normalize_message(raw_msg)
                    message_normalization_duration += (time.perf_counter() - norm_start) * 1000

                    msg_history_id = raw_msg.get("historyId")
                    if msg_history_id:
                        latest_history_id = str(msg_history_id)
                except Exception as exc:
                    logger.warning(f"Could not retrieve or normalize Gmail message {msg_id}: {exc}")
                    failed_messages += 1
                    continue

                # 1. Thread Association: Check if existing proposal exists for thread
                existing_proposal_id = None
                has_thread_history = False
                if norm.thread_id:
                    db_thread_start = time.perf_counter()
                    stmt_thread = (
                        select(Email.proposal_id)
                        .filter(
                            Email.company_id == company_id,
                            Email.thread_id == norm.thread_id,
                            Email.proposal_id.isnot(None),
                        )
                        .order_by(Email.created_at.desc())
                    )
                    thread_res = (await db.execute(stmt_thread)).scalars()
                    existing_proposal_id = thread_res.first() if hasattr(thread_res, "first") else None
                    db_persistence_duration += (time.perf_counter() - db_thread_start) * 1000
                    if existing_proposal_id:
                        has_thread_history = True

                # 2. Advanced Multi-Signal Email Classification
                email_body_clean = norm.body_text or norm.body_html or norm.raw_snippet or ""
                class_start = time.perf_counter()
                classification_res = EmailClassifier.classify(
                    sender=norm.sender,
                    recipient=account.email_address,
                    subject=norm.subject or "",
                    body=email_body_clean,
                    account_email=account.email_address,
                    is_existing_thread=bool(existing_proposal_id),
                    has_thread_history=has_thread_history,
                )
                message_normalization_duration += (time.perf_counter() - class_start) * 1000

                proposal_id: Optional[UUID] = None
                if classification_res.is_actionable:
                    db_prop_start = time.perf_counter()
                    if existing_proposal_id:
                        proposal_id = existing_proposal_id
                        stmt_prop = select(Proposal).filter(Proposal.id == proposal_id, Proposal.company_id == company_id)
                        prop_res = await db.execute(stmt_prop)
                        prop_obj = prop_res.scalar_one_or_none() if hasattr(prop_res, "scalar_one_or_none") else None
                        if prop_obj:
                            prop_obj.status = ProposalStatus.PROCESSING
                            prop_obj.classification = classification_res.classification.value
                            prop_obj.updated_at = datetime.now(timezone.utc)
                    else:
                        proposal_title = norm.subject if norm.subject and norm.subject.strip() else "Untitled Customer Inquiry"
                        proposal = Proposal(
                            company_id=company_id,
                            title=proposal_title,
                            status=ProposalStatus.RECEIVED,
                            classification=classification_res.classification.value,
                        )
                        db.add(proposal)
                        await db.flush()
                        proposal_id = proposal.id
                        new_proposals += 1
                        created_proposal_ids.append(proposal.id)
                    db_persistence_duration += (time.perf_counter() - db_prop_start) * 1000

                # 3. Create incoming Email record with classification metadata
                db_email_start = time.perf_counter()
                email_rec = Email(
                    company_id=company_id,
                    proposal_id=proposal_id,
                    email_account_id=account.id,
                    direction=EmailDirection.INCOMING,
                    classification=classification_res.classification.value,
                    sender_address=norm.sender,
                    recipient_address=account.email_address,
                    subject=norm.subject,
                    body=email_body_clean,
                    message_id=norm.message_id,
                    thread_id=norm.thread_id,
                    created_at=norm.received_at,
                )
                db.add(email_rec)
                await db.flush()
                db_persistence_duration += (time.perf_counter() - db_email_start) * 1000

                # Process attachments
                for att_meta in norm.attachments:
                    attachments_discovered += 1
                    raw_bytes = att_meta.data

                    # Oversized check before download if size is known
                    if att_meta.size_bytes and att_meta.size_bytes > MAX_ATTACHMENT_SIZE:
                        att_record = EmailAttachment(
                            company_id=company_id,
                            email_id=email_rec.id,
                            proposal_id=proposal_id,
                            filename=att_meta.filename,
                            content_type=att_meta.content_type,
                            file_size_bytes=att_meta.size_bytes,
                            storage_path=None,
                            extracted_text=None,
                            parsing_status="OVERSIZED",
                            page_count=None,
                            error_message="Attachment exceeds maximum allowed size (25MB)",
                        )
                        db.add(att_record)
                        continue

                    # If attachment bytes were not inlined, fetch via API in threadpool
                    if not raw_bytes and att_meta.attachment_id:
                        try:
                            att_fetch_start = time.perf_counter()
                            raw_bytes = await asyncio.to_thread(client.get_attachment, msg_id, att_meta.attachment_id)
                            gmail_api_fetch_duration += (time.perf_counter() - att_fetch_start) * 1000
                        except Exception as exc:
                            logger.warning(f"Could not download attachment {att_meta.filename}: {exc}")
                            raw_bytes = None

                    storage_path = None
                    parsed_text = None
                    parse_status = "FAILED"
                    page_count = None
                    err_msg = None

                    if raw_bytes:
                        if len(raw_bytes) > MAX_ATTACHMENT_SIZE:
                            parse_status = "OVERSIZED"
                            err_msg = "Attachment exceeds maximum allowed size (25MB)"
                        else:
                            try:
                                # Save to disk
                                att_save_start = time.perf_counter()
                                storage_path = storage.save_attachment(
                                    company_id=company_id,
                                    filename=att_meta.filename,
                                    content=raw_bytes,
                                    proposal_id=proposal_id,
                                )
                                attachment_processing_duration += (time.perf_counter() - att_save_start) * 1000

                                # Parse with generic parser in threadpool
                                parse_start = time.perf_counter()
                                parsed_doc = await asyncio.to_thread(
                                    parser.parse,
                                    content=raw_bytes,
                                    filename=att_meta.filename,
                                    content_type=att_meta.content_type,
                                )
                                document_extraction_duration += (time.perf_counter() - parse_start) * 1000

                                parse_status = parsed_doc.status.value
                                parsed_text = parsed_doc.text if parsed_doc.status == DocumentParseStatus.SUCCESS else None
                                page_count = parsed_doc.page_count
                                err_msg = parsed_doc.error_message
                            except Exception as e:
                                err_msg = str(e)
                                parse_status = "FAILED"
                    else:
                        err_msg = "Attachment data could not be retrieved"

                    # Persist EmailAttachment record
                    att_record = EmailAttachment(
                        company_id=company_id,
                        email_id=email_rec.id,
                        proposal_id=proposal_id,
                        filename=att_meta.filename,
                        content_type=att_meta.content_type,
                        file_size_bytes=att_meta.size_bytes or (len(raw_bytes) if raw_bytes else 0),
                        storage_path=storage_path,
                        extracted_text=parsed_text,
                        parsing_status=parse_status,
                        page_count=page_count,
                        error_message=err_msg,
                    )
                    db.add(att_record)

                # Audit log for proposal creation or update
                if proposal_id:
                    audit = AuditLog(
                        company_id=company_id,
                        proposal_id=proposal_id,
                        action="INGESTED_FROM_GMAIL",
                        details=f"Ingested email '{norm.subject}' from {norm.sender} with {len(norm.attachments)} attachment(s).",
                    )
                    db.add(audit)

                new_emails += 1

            # Update sync metadata on email account
            db_commit_start = time.perf_counter()
            account.last_synced_at = datetime.now(timezone.utc)
            if latest_history_id:
                account.history_id = latest_history_id
            await db.commit()
            db_persistence_duration += (time.perf_counter() - db_commit_start) * 1000

            total_duration_ms = (time.perf_counter() - start_total) * 1000

            durations_dict = {
                "gmail_api_fetch_ms": round(gmail_api_fetch_duration, 2),
                "message_normalization_ms": round(message_normalization_duration, 2),
                "database_persistence_ms": round(db_persistence_duration, 2),
                "attachment_processing_ms": round(attachment_processing_duration, 2),
                "document_extraction_ms": round(document_extraction_duration, 2),
                "embedding_generation_ms": 0.0,
                "rag_retrieval_ms": 0.0,
                "gemini_generation_ms": 0.0,
                "total_duration_ms": round(total_duration_ms, 2),
            }

            logger.info(
                "Gmail inbox sync completed: company_id=%s, strategy=%s, examined=%d, "
                "new=%d, proposals=%d, dupes=%d, failed=%d, fetch_ms=%.1f, db_ms=%.1f, total_ms=%.1f",
                company_id,
                sync_strategy,
                messages_examined,
                new_emails,
                new_proposals,
                skipped_dupes,
                failed_messages,
                gmail_api_fetch_duration,
                db_persistence_duration,
                total_duration_ms,
            )

            result = GmailSyncResult(
                account_id=str(account.id),
                email_address=account.email_address,
                messages_examined=messages_examined,
                new_emails_count=new_emails,
                proposals_created_count=new_proposals,
                skipped_duplicates_count=skipped_dupes,
                attachments_discovered_count=attachments_discovered,
                failed_messages_count=failed_messages,
                sync_status="COMPLETED",
                synced_at=datetime.now(timezone.utc).isoformat(),
                history_id=account.history_id,
                sync_strategy=sync_strategy,
                durations=durations_dict,
            )

            return result, created_proposal_ids

