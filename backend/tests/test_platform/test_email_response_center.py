import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from uuid import uuid4
from datetime import datetime, timezone
from httpx import AsyncClient, ASGITransport

from app.main import app
from app.core.database import get_db
from app.models.company import Company
from app.models.user import User, UserRole
from app.models.proposal import Proposal, ProposalStatus
from app.models.email import Email, EmailDirection
from app.models.audit import AuditLog
from app.auth.services.jwt_service import JWTService
from app.platform.services.email_classifier import EmailClassifier, EmailClassification
from app.platform.services.proposal_service import ProposalService


# ==========================================
# 1. Email Classifier Unit Tests
# ==========================================

def test_classifier_identifies_self_sent_emails():
    res = EmailClassifier.classify(
        sender="sales@lunetron.com",
        recipient="client@acme.com",
        subject="Our quotation",
        body="Attached is the price quote.",
        account_email="sales@lunetron.com",
    )
    assert res.classification == EmailClassification.INTERNAL_OR_SELF_SENT
    assert not res.is_actionable


def test_classifier_identifies_automated_notifications():
    res1 = EmailClassifier.classify(
        sender="no-reply@github.com",
        recipient="sales@lunetron.com",
        subject="[GitHub] New pull request",
        body="Pull request #42 opened.",
        account_email="sales@lunetron.com",
    )
    assert res1.classification == EmailClassification.AUTOMATED_NOTIFICATION
    assert not res1.is_actionable

    res2 = EmailClassifier.classify(
        sender="service@google.com",
        recipient="sales@lunetron.com",
        subject="Security alert: New sign-in",
        body="We detected a new sign-in on your account.",
        account_email="sales@lunetron.com",
    )
    assert res2.classification == EmailClassification.AUTOMATED_NOTIFICATION
    assert not res2.is_actionable


def test_classifier_identifies_newsletters_and_spam():
    # Newsletter
    res_news = EmailClassifier.classify(
        sender="marketing@cloudweekly.com",
        recipient="sales@lunetron.com",
        subject="Cloud Weekly Digest #120",
        body="Here are top cloud news. Click here to unsubscribe or manage preferences.",
        account_email="sales@lunetron.com",
    )
    assert res_news.classification == EmailClassification.NEWSLETTER
    assert not res_news.is_actionable

    # Spam
    res_spam = EmailClassifier.classify(
        sender="random@unknown.com",
        recipient="sales@lunetron.com",
        subject="Urgent: Claim your prize now!",
        body="Congratulations, you won 10 million dollars in crypto giveaway.",
        account_email="sales@lunetron.com",
    )
    assert res_spam.classification == EmailClassification.SPAM_OR_IRRELEVANT
    assert not res_spam.is_actionable


def test_classifier_identifies_customer_requests_and_follow_ups():
    # Customer Request
    res_rfp = EmailClassifier.classify(
        sender="procurement@enterprise.com",
        recipient="sales@lunetron.com",
        subject="RFP: Cloud Migration and AI Integration Proposal",
        body="We require a detailed quote and scope of work for 500 seats by Nov 30.",
        account_email="sales@lunetron.com",
    )
    assert res_rfp.classification == EmailClassification.CUSTOMER_REQUEST
    assert res_rfp.is_actionable
    assert res_rfp.confidence >= 0.85

    # Follow-up on ongoing thread
    res_follow = EmailClassifier.classify(
        sender="procurement@enterprise.com",
        recipient="sales@lunetron.com",
        subject="Re: RFP Clarifications",
        body="Thanks for the update. Could we adjust the SLA tier to 99.99%?",
        account_email="sales@lunetron.com",
        is_existing_thread=True,
        has_thread_history=True,
    )
    assert res_follow.classification == EmailClassification.FOLLOW_UP
    assert res_follow.is_actionable


# ==========================================
# 2. Proposal Service Draft & Lifecycle Tests
# ==========================================

@pytest.mark.asyncio
async def test_update_proposal_draft_invalidates_prior_approval():
    company_id = uuid4()
    prop_id = uuid4()
    user_id = uuid4()

    proposal = Proposal(
        id=prop_id,
        company_id=company_id,
        status=ProposalStatus.APPROVED,
        title="Acme Proposal",
    )

    mock_db = AsyncMock()
    mock_db.add = MagicMock()
    mock_db.commit = AsyncMock()
    mock_db.refresh = AsyncMock()

    # Outgoing email mock
    outgoing_email = Email(
        id=uuid4(),
        company_id=company_id,
        proposal_id=prop_id,
        direction=EmailDirection.OUTGOING,
        subject="Original Proposal Response",
        body="Original AI draft content",
    )

    def mock_execute(stmt):
        mock_res = MagicMock()
        where_str = str(getattr(stmt, "whereclause", "")).lower()
        if "outgoing" in where_str or "emails" in str(stmt).lower():
            mock_res.scalars.return_value.first.return_value = outgoing_email
        else:
            mock_res.scalar_one_or_none.return_value = proposal
        return mock_res

    mock_db.execute.side_effect = mock_execute

    with patch.object(ProposalService, "get_proposal", return_value=proposal):
        updated = await ProposalService.update_proposal_draft(
            db=mock_db,
            proposal_id=prop_id,
            company_id=company_id,
            subject="Updated Custom Proposal Subject",
            body="Reviewer manually tailored pricing and delivery schedule.",
            user_id=user_id,
        )

    # 1. Draft text was updated
    assert outgoing_email.body == "Reviewer manually tailored pricing and delivery schedule."
    assert outgoing_email.subject == "Updated Custom Proposal Subject"

    # 2. Crucial Security Rule: Prior approval was invalidated
    assert updated.status == ProposalStatus.REVIEW_REQUIRED

    # 3. Audit trail was recorded
    audit_calls = [c for c in mock_db.add.call_args_list if isinstance(c[0][0], AuditLog)]
    assert len(audit_calls) >= 1
    assert "Prior approval was invalidated" in audit_calls[0][0][0].details


# ==========================================
# 3. HTTP Endpoints & Tenant Isolation Tests
# ==========================================

@pytest.mark.asyncio
async def test_response_center_metrics_endpoint():
    company_id = uuid4()
    user_id = uuid4()
    token = JWTService.create_access_token(str(user_id), str(company_id), UserRole.ADMIN.value)

    mock_db = AsyncMock()

    # Return empty lists for proposals and emails
    mock_res = MagicMock()
    mock_res.scalars.return_value.all.return_value = []
    mock_db.execute.return_value = mock_res

    app.dependency_overrides[get_db] = lambda: mock_db
    try:
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            resp = await client.get(
                "/api/v1/proposals/metrics",
                headers={"Authorization": f"Bearer {token}"},
            )
            assert resp.status_code == 200
            data = resp.json()
            assert "total_inbox" in data
            assert "customer_requests" in data
            assert "drafts_generated" in data
            assert "awaiting_review" in data
            assert "approved" in data
            assert "sent" in data
    finally:
        app.dependency_overrides.pop(get_db, None)


@pytest.mark.asyncio
async def test_tenant_isolation_on_proposal_detail():
    company_a = uuid4()
    company_b = uuid4()
    user_a = uuid4()
    prop_b_id = uuid4()

    token_user_a = JWTService.create_access_token(str(user_a), str(company_a), UserRole.ADMIN.value)

    mock_db = AsyncMock()
    # Executing query for prop_b_id with company_a returns None
    mock_res = MagicMock()
    mock_res.scalar_one_or_none.return_value = None
    mock_db.execute.return_value = mock_res

    app.dependency_overrides[get_db] = lambda: mock_db
    try:
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            resp = await client.get(
                f"/api/v1/proposals/{prop_b_id}/detail",
                headers={"Authorization": f"Bearer {token_user_a}"},
            )
            # Tenant A is blocked from seeing Tenant B's proposal
            assert resp.status_code == 404
    finally:
        app.dependency_overrides.pop(get_db, None)
