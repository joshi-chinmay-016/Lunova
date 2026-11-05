"""Dispatches human-approved proposal emails via the connected company Gmail account.
Implements durable dispatch states (SENDING, DISPATCH_UNCERTAIN), concurrent send locks,
safe timeout handling, and out-of-band reconciliation workflows.
"""

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
    """Dispatches human-approved proposal emails via the connected company Gmail account.
    Enforces durable state tracking, timeout safety, and reconciliation workflows.
    """

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
        Locks state with durable SENDING, handles network timeouts with DISPATCH_UNCERTAIN,
        and prevents concurrent duplicate sends.
        """
        # 1. Load proposal with company-scoped authorization and pessimistic row lock
        stmt_p = select(Proposal).filter(
            Proposal.id == proposal_id,
            Proposal.company_id == company_id,
        ).with_for_update()
        proposal = (await db.execute(stmt_p)).scalar_one_or_none()
        if not proposal:
            raise ValueError("Proposal not found.")

        # Guard: Check status
        if proposal.status == ProposalStatus.SENT:
            raise ValueError("Proposal has already been dispatched.")
        if proposal.status == ProposalStatus.SENDING:
            raise ValueError(
                "Proposal is currently being dispatched (state 'SENDING'). "
                "Concurrent duplicate sends are prevented."
            )
        if proposal.status == ProposalStatus.DISPATCH_UNCERTAIN:
            raise ValueError(
                "Proposal dispatch status is uncertain due to a previous network timeout. "
                "Safe reconciliation is required before any further dispatch can occur."
            )
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
            clean_in_reply_to = in_reply_to if in_reply_to.startswith("<") else f"<{in_reply_to}>"
            msg["In-Reply-To"] = clean_in_reply_to
            msg["References"] = clean_in_reply_to

        msg.set_content(outgoing_email.body)
        raw_email_bytes = msg.as_bytes()

        # 6. Commit durable SENDING state to prevent concurrent duplicate requests
        proposal.status = ProposalStatus.SENDING
        db.add(
            AuditLog(
                company_id=company_id,
                proposal_id=proposal_id,
                user_id=user_id,
                action="DISPATCH_STARTED",
                details=f"Initiating dispatch of proposal response to {recipient} via Gmail.",
            )
        )
        await db.commit()
        await db.refresh(proposal)

        # 7. Dispatch via Gmail API
        client = custom_client
        if not client:
            decrypted_access_token = GmailOAuthService.decrypt_token(account.encrypted_access_token)
            client = GmailClient(access_token=decrypted_access_token)

        try:
            send_res = client.send_message(raw_email_bytes, thread_id=thread_id)
        except Exception as exc:
            logger.error(f"Failed to dispatch Gmail message for proposal {proposal_id}: {exc}")
            exc_str = str(exc).lower()
            is_timeout = (
                isinstance(exc, TimeoutError)
                or "timeout" in exc_str
                or "timed out" in exc_str
                or "connection reset" in exc_str
            )

            if is_timeout:
                # Network timeout occurred after submission: delivery outcome is uncertain
                proposal.status = ProposalStatus.DISPATCH_UNCERTAIN
                db.add(
                    AuditLog(
                        company_id=company_id,
                        proposal_id=proposal_id,
                        user_id=user_id,
                        action="DISPATCH_UNCERTAIN",
                        details=(
                            f"Network timeout occurred while dispatching email to {recipient}: {str(exc)}. "
                            "Delivery status unknown. Automatic retry is blocked; manual reconciliation required."
                        ),
                    )
                )
                await db.commit()
                raise RuntimeError(
                    f"Dispatch outcome uncertain: A network timeout occurred after message submission: {str(exc)}. "
                    "Proposal marked as DISPATCH_UNCERTAIN. Do not retry without manual reconciliation."
                ) from exc
            else:
                # Explicit non-timeout failure (e.g. invalid recipient, quota exceeded)
                # Reset to APPROVED so the reviewer can correct issues
                proposal.status = ProposalStatus.APPROVED
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

        # 8. Record success and finalize lifecycle
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

    @classmethod
    async def reconcile_dispatch(
        cls,
        db: AsyncSession,
        proposal_id: UUID,
        company_id: UUID,
        action: str,
        notes: str,
        user_id: Optional[UUID] = None,
        external_message_id: Optional[str] = None,
    ) -> Proposal:
        """Safely reconciles a proposal in DISPATCH_UNCERTAIN state after out-of-band verification.
        Enforces multi-tenant ownership and explicit reviewer action.
        """
        stmt_p = select(Proposal).filter(
            Proposal.id == proposal_id,
            Proposal.company_id == company_id,
        ).with_for_update()
        proposal = (await db.execute(stmt_p)).scalar_one_or_none()
        if not proposal:
            raise ValueError("Proposal not found.")

        if proposal.status not in (ProposalStatus.DISPATCH_UNCERTAIN, ProposalStatus.SENDING):
            raise ValueError(
                f"Proposal is in '{proposal.status}' state. Only proposals in 'DISPATCH_UNCERTAIN' or stuck in 'SENDING' can be reconciled."
            )

        if not notes or not notes.strip():
            raise ValueError("Reviewer notes are mandatory for dispatch reconciliation.")

        action_upper = action.strip().upper()
        if action_upper == "CONFIRM_DELIVERED":
            proposal.status = ProposalStatus.SENT
            if external_message_id:
                stmt_out = select(Email).filter(
                    Email.proposal_id == proposal_id,
                    Email.company_id == company_id,
                    Email.direction == EmailDirection.OUTGOING,
                )
                outgoing = (await db.execute(stmt_out)).scalars().first()
                if outgoing:
                    outgoing.message_id = external_message_id

            db.add(
                AuditLog(
                    company_id=company_id,
                    proposal_id=proposal_id,
                    user_id=user_id,
                    action="DISPATCH_RECONCILED",
                    details=f"Reviewer confirmed message was delivered out-of-band. Notes: {notes.strip()}",
                )
            )
        elif action_upper == "RESET_FOR_RESEND":
            proposal.status = ProposalStatus.APPROVED
            db.add(
                AuditLog(
                    company_id=company_id,
                    proposal_id=proposal_id,
                    user_id=user_id,
                    action="DISPATCH_RESET",
                    details=f"Reviewer confirmed message was not delivered and reset proposal to APPROVED for resend. Notes: {notes.strip()}",
                )
            )
        else:
            raise ValueError(
                f"Invalid reconciliation action '{action}'. Must be 'CONFIRM_DELIVERED' or 'RESET_FOR_RESEND'."
            )

        await db.commit()
        await db.refresh(proposal)
        return proposal
