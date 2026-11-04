import email.message
import logging
from typing import Optional
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.audit import AuditLog
from app.models.email import Email, EmailDirection
from app.models.proposal import Proposal, ProposalStatus
from app.platform.integrations.gmail.client import BaseGmailClient, GmailClient
from app.platform.services.gmail_oauth_service import GmailOAuthService

logger = logging.getLogger(__name__)


class GmailSendService:
    """Dispatches human-approved proposal emails via the connected company Gmail account."""

    @classmethod
    async def send_approved_proposal(
        cls,
        db: AsyncSession,
        proposal_id: UUID,
        company_id: UUID,
        user_id: Optional[UUID] = None,
        custom_client: Optional[BaseGmailClient] = None,
    ) -> Proposal:
        """Sends the approved draft email for a proposal via Gmail.
        Strictly enforces that the proposal must be in APPROVED status before sending.
        """
        # 1. Load proposal with company-scoped authorization
        stmt_p = select(Proposal).filter(
            Proposal.id == proposal_id,
            Proposal.company_id == company_id,
        )
        proposal = (await db.execute(stmt_p)).scalar_one_or_none()
        if not proposal:
            raise ValueError("Proposal not found.")

        # Guard: Check status
        if proposal.status == ProposalStatus.SENT:
            raise ValueError("Proposal has already been dispatched.")
        if proposal.status != ProposalStatus.APPROVED:
            raise ValueError(
                f"Proposal is in '{proposal.status}' state. Only 'APPROVED' proposals can be sent to clients."
            )

        # 2. Retrieve connected Gmail account
        account = await GmailOAuthService.get_company_email_account(db, company_id)
        if not account or not account.is_active:
            raise ValueError("No active Gmail account connected for this company.")

        # 3. Retrieve draft outgoing email
        stmt_out = (
            select(Email)
            .filter(
                Email.proposal_id == proposal_id,
                Email.company_id == company_id,
                Email.direction == EmailDirection.OUTGOING,
            )
            .order_by(Email.created_at.desc())
        )
        outgoing_email = (await db.execute(stmt_out)).scalars().first()
        if not outgoing_email or not outgoing_email.body or not outgoing_email.body.strip():
            raise ValueError("No outgoing proposal draft found to send.")

        # 4. Retrieve incoming email to obtain recipient address and thread context
        stmt_in = (
            select(Email)
            .filter(
                Email.proposal_id == proposal_id,
                Email.company_id == company_id,
                Email.direction == EmailDirection.INCOMING,
            )
            .order_by(Email.created_at.asc())
        )
        incoming_email = (await db.execute(stmt_in)).scalars().first()

        recipient = (
            outgoing_email.recipient_address
            or (incoming_email.sender_address if incoming_email else None)
        )
        if not recipient:
            raise ValueError("Cannot dispatch proposal: No recipient address identified.")

        subject = outgoing_email.subject or (
            f"Re: {incoming_email.subject}" if incoming_email and incoming_email.subject else "Proposal Response"
        )
        thread_id = incoming_email.thread_id if incoming_email else None
        in_reply_to = incoming_email.message_id if incoming_email else None

        # 5. Build RFC 2822 message
        msg = email.message.EmailMessage()
        msg["From"] = account.email_address
        msg["To"] = recipient
        msg["Subject"] = subject
        if in_reply_to:
            # Format message id cleanly
            clean_in_reply_to = in_reply_to if in_reply_to.startswith("<") else f"<{in_reply_to}>"
            msg["In-Reply-To"] = clean_in_reply_to
            msg["References"] = clean_in_reply_to

        msg.set_content(outgoing_email.body)
        raw_email_bytes = msg.as_bytes()

        # 6. Dispatch via Gmail API
        client = custom_client
        if not client:
            decrypted_access_token = GmailOAuthService.decrypt_token(account.encrypted_access_token)
            client = GmailClient(access_token=decrypted_access_token)

        try:
            send_res = client.send_message(raw_email_bytes, thread_id=thread_id)
        except Exception as exc:
            logger.error(f"Failed to dispatch Gmail message for proposal {proposal_id}: {exc}")
            db.add(
                AuditLog(
                    company_id=company_id,
                    proposal_id=proposal_id,
                    user_id=user_id,
                    action="DISPATCH_FAILED",
                    details=f"Failed to send email to {recipient}: {str(exc)}",
                )
            )
            await db.commit()
            raise RuntimeError(f"Gmail send failed: {str(exc)}") from exc

        # 7. Record success and update proposal lifecycle
        sent_msg_id = send_res.get("id")
        sent_thread_id = send_res.get("threadId") or thread_id

        outgoing_email.message_id = sent_msg_id
        if sent_thread_id:
            outgoing_email.thread_id = sent_thread_id

        proposal.status = ProposalStatus.SENT

        db.add(
            AuditLog(
                company_id=company_id,
                proposal_id=proposal_id,
                user_id=user_id,
                action="DISPATCHED",
                details=f"Successfully dispatched proposal response to {recipient} via Gmail (id: {sent_msg_id}).",
            )
        )

        await db.commit()
        await db.refresh(proposal)
        return proposal

