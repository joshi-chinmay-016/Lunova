import logging
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import List, Optional
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


class GmailSyncService:
    """Orchestrates manual synchronization of incoming emails from a connected Gmail account."""

    @classmethod
    async def get_authenticated_client(
        cls,
        db: AsyncSession,
        account: EmailAccount,
    ) -> BaseGmailClient:
        """Retrieves an authenticated Gmail API client, refreshing expired tokens when needed."""
        # Check if token is expired or about to expire
        if account.token_expiry:
            # If expired, refresh
            if account.token_expiry <= datetime.now(timezone.utc):
                account = await GmailOAuthService.refresh_access_token(db, account)

        decrypted_access_token = GmailOAuthService.decrypt_token(account.encrypted_access_token)
        return GmailClient(access_token=decrypted_access_token)

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
        # 1. Retrieve active email account for tenant
        account = await GmailOAuthService.get_company_email_account(db, company_id)
        if not account or not account.is_active:
            raise ValueError("No active Gmail account connected for this company.")

        # 2. Get client
        client = custom_client or await cls.get_authenticated_client(db, account)
        storage = attachment_storage or AttachmentStorageService()
        parser = AttachmentParser(max_bytes=25 * 1024 * 1024)

        # 3. List messages
        try:
            message_stubs = client.list_messages(query="label:INBOX", max_results=max_messages)
        except Exception as exc:
            logger.error(f"Failed to query Gmail messages for company {company_id}: {exc}")
            raise RuntimeError(f"Gmail sync failed: {str(exc)}") from exc

        new_emails = 0
        new_proposals = 0
        skipped_dupes = 0
        created_proposal_ids: List[UUID] = []

        for stub in message_stubs:
            msg_id = stub.get("id")
            if not msg_id:
                continue

            # Idempotency check: verify message has not already been ingested
            stmt = select(Email).filter(
                Email.company_id == company_id,
                Email.message_id == msg_id,
            )
            existing = (await db.execute(stmt)).scalars().first()
            if existing:
                skipped_dupes += 1
                continue

            # Retrieve full message
            try:
                raw_msg = client.get_message(msg_id)
                norm: NormalizedEmailMessage = GmailMessageNormalizer.normalize_message(raw_msg)
            except Exception as exc:
                logger.warning(f"Could not retrieve or normalize Gmail message {msg_id}: {exc}")
                continue

            # Create Proposal record
            proposal_title = norm.subject if norm.subject and norm.subject.strip() else "Untitled Proposal Inquiry"
            proposal = Proposal(
                company_id=company_id,
                title=proposal_title,
                status=ProposalStatus.RECEIVED,
            )
            db.add(proposal)
            await db.flush()

            # Create incoming Email record
            email_rec = Email(
                company_id=company_id,
                proposal_id=proposal.id,
                email_account_id=account.id,
                direction=EmailDirection.INCOMING,
                sender_address=norm.sender,
                recipient_address=account.email_address,
                subject=norm.subject,
                body=norm.body_text or norm.body_html or norm.raw_snippet or "",
                message_id=norm.message_id,
                thread_id=norm.thread_id,
                created_at=norm.received_at,
            )
            db.add(email_rec)
            await db.flush()

            # Process attachments
            for att_meta in norm.attachments:
                raw_bytes = att_meta.data
                # If attachment bytes were not inlined, fetch via API
                if not raw_bytes and att_meta.attachment_id:
                    try:
                        raw_bytes = client.get_attachment(msg_id, att_meta.attachment_id)
                    except Exception as exc:
                        logger.warning(f"Could not download attachment {att_meta.filename}: {exc}")
                        raw_bytes = None

                storage_path = None
                parsed_text = None
                parse_status = "FAILED"
                page_count = None
                err_msg = None

                if raw_bytes:
                    try:
                        # Save to disk
                        storage_path = storage.save_attachment(
                            company_id=company_id,
                            filename=att_meta.filename,
                            content=raw_bytes,
                            proposal_id=proposal.id,
                        )
                        # Parse with existing parser
                        parsed_doc = parser.parse(
                            content=raw_bytes,
                            filename=att_meta.filename,
                            content_type=att_meta.content_type,
                        )
                        parse_status = parsed_doc.status.value
                        parsed_text = parsed_doc.text if parsed_doc.status == DocumentParseStatus.SUCCESS else None
                        page_count = parsed_doc.page_count
                        err_msg = parsed_doc.error_message
                    except Exception as e:
                        err_msg = str(e)
                        parse_status = "FAILED"

                # Persist EmailAttachment record
                att_record = EmailAttachment(
                    company_id=company_id,
                    email_id=email_rec.id,
                    proposal_id=proposal.id,
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

            # Audit log
            audit = AuditLog(
                company_id=company_id,
                proposal_id=proposal.id,
                action="INGESTED_FROM_GMAIL",
                details=f"Ingested email '{norm.subject}' from {norm.sender} with {len(norm.attachments)} attachment(s).",
            )
            db.add(audit)

            new_emails += 1
            new_proposals += 1
            created_proposal_ids.append(proposal.id)

        # Update sync metadata on email account
        account.last_synced_at = datetime.now(timezone.utc)
        await db.commit()

        result = GmailSyncResult(
            account_id=str(account.id),
            email_address=account.email_address,
            new_emails_count=new_emails,
            proposals_created_count=new_proposals,
            skipped_duplicates_count=skipped_dupes,
            synced_at=datetime.now(timezone.utc).isoformat(),
        )

        return result, created_proposal_ids

