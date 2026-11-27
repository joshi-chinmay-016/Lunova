import re
from dataclasses import dataclass, field
from enum import Enum
from typing import Dict, List, Optional


class EmailClassification(str, Enum):
    CUSTOMER_REQUEST = "CUSTOMER_REQUEST"
    FOLLOW_UP = "FOLLOW_UP"
    GENERAL_INQUIRY = "GENERAL_INQUIRY"
    AUTOMATED_NOTIFICATION = "AUTOMATED_NOTIFICATION"
    NEWSLETTER = "NEWSLETTER"
    SPAM_OR_IRRELEVANT = "SPAM_OR_IRRELEVANT"
    INTERNAL_OR_SELF_SENT = "INTERNAL_OR_SELF_SENT"


@dataclass
class ClassificationResult:
    classification: EmailClassification
    confidence: float
    reasons: List[str] = field(default_factory=list)
    is_actionable: bool = False
    signals: Dict[str, any] = field(default_factory=dict)


class EmailClassifier:
    """Classifies incoming emails into operational categories for the Lunova response pipeline."""

    AUTOMATED_SENDERS = (
        "no-reply@",
        "noreply@",
        "mailer-daemon@",
        "postmaster@",
        "notifications@",
        "notification@",
        "donotreply@",
        "do-not-reply@",
        "bounce@",
        "alerts@",
        "support@github.com",
        "gitlab@",
        "billing@",
        "stripe.com",
    )

    AUTOMATED_SUBJECTS = (
        "automatic reply:",
        "auto reply:",
        "out of office:",
        "undelivered mail",
        "delivery status notification",
        "invitation:",
        "accepted:",
        "declined:",
        "security alert",
        "password reset",
        "verify your email",
        "verification code",
        "one-time password",
        "receipt for your payment",
        "your invoice",
    )

    NEWSLETTER_MARKERS = (
        "unsubscribe",
        "manage preferences",
        "view in browser",
        "email preferences",
        "privacy policy",
        "all rights reserved",
    )

    SPAM_PATTERNS = (
        r"\bclaim your prize\b",
        r"\bcongratulations, you won\b",
        r"\bwire transfer\b",
        r"\bcrypto giveaway\b",
        r"\bviagra\b",
        r"\bcasino\b",
        r"\bmillion dollars\b",
        r"\bbeneficiary\b",
        r"\binheritance\b",
    )

    CUSTOMER_REQUEST_TERMS = (
        "rfp",
        "request for proposal",
        "quote",
        "quotation",
        "pricing",
        "cost estimate",
        "scope of work",
        "sow",
        "deliverables",
        "timeline",
        "deadline",
        "specification",
        "requirements",
        "enterprise tier",
        "contract",
        "bid",
        "tender",
        "proposal",
        "proof of concept",
        "poc",
        "sla",
        "features",
    )

    @classmethod
    def classify(
        cls,
        sender: str,
        recipient: str,
        subject: str,
        body: str,
        account_email: Optional[str] = None,
        is_existing_thread: bool = False,
        has_thread_history: bool = False,
    ) -> ClassificationResult:
        sender_clean = (sender or "").strip().lower()
        recipient_clean = (recipient or "").strip().lower()
        subject_clean = (subject or "").strip().lower()
        body_clean = (body or "").strip().lower()
        account_clean = (account_email or "").strip().lower()

        reasons = []

        # 1. Internal or Self-Sent Filter
        if account_clean and (account_clean in sender_clean or sender_clean == account_clean):
            return ClassificationResult(
                classification=EmailClassification.INTERNAL_OR_SELF_SENT,
                confidence=1.0,
                reasons=["Sender address matches connected account address."],
                is_actionable=False,
            )

        # 2. Automated Notification Filter
        for auto_sender in cls.AUTOMATED_SENDERS:
            if auto_sender in sender_clean:
                return ClassificationResult(
                    classification=EmailClassification.AUTOMATED_NOTIFICATION,
                    confidence=0.95,
                    reasons=[f"Sender matched automated notification pattern: {auto_sender}"],
                    is_actionable=False,
                )

        for auto_sub in cls.AUTOMATED_SUBJECTS:
            if subject_clean.startswith(auto_sub) or auto_sub in subject_clean:
                return ClassificationResult(
                    classification=EmailClassification.AUTOMATED_NOTIFICATION,
                    confidence=0.90,
                    reasons=[f"Subject matched automated notification pattern: {auto_sub}"],
                    is_actionable=False,
                )

        # 3. Spam / Junk Filter
        for pattern in cls.SPAM_PATTERNS:
            if re.search(pattern, subject_clean) or re.search(pattern, body_clean):
                return ClassificationResult(
                    classification=EmailClassification.SPAM_OR_IRRELEVANT,
                    confidence=0.90,
                    reasons=[f"Content matched spam pattern: {pattern}"],
                    is_actionable=False,
                )

        # 4. Newsletter / Bulk Marketing Filter
        newsletter_hits = sum(1 for marker in cls.NEWSLETTER_MARKERS if marker in body_clean)
        is_reply = subject_clean.startswith("re:") or subject_clean.startswith("fwd:")
        request_hits = [term for term in cls.CUSTOMER_REQUEST_TERMS if term in subject_clean or term in body_clean]

        if newsletter_hits >= 1 and not request_hits and not is_reply:
            return ClassificationResult(
                classification=EmailClassification.NEWSLETTER,
                confidence=0.88,
                reasons=[f"Body contained bulk marketing/newsletter markers ({newsletter_hits} markers) without proposal inquiry."],
                is_actionable=False,
            )

        # 5. Follow-Up Detection
        if is_existing_thread or (is_reply and has_thread_history):
            return ClassificationResult(
                classification=EmailClassification.FOLLOW_UP,
                confidence=0.90,
                reasons=["Message belongs to an ongoing thread with prior discussion history."],
                is_actionable=True,
                signals={"is_reply": is_reply, "thread_linked": is_existing_thread},
            )

        # 6. Customer Request vs General Inquiry
        deadline_match = re.search(r"\b(due|deadline|by|before)\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|\d{1,2}[\/\-\.]\d{1,2}|next week|eod|tomorrow)\b", body_clean)
        pricing_match = re.search(r"(\$|€|£|pricing|quote|cost|rate|budget|tier)", body_clean)

        signals = {
            "matched_terms": request_hits,
            "has_deadline": bool(deadline_match),
            "has_pricing_signal": bool(pricing_match),
            "question_count": body_clean.count("?"),
        }

        if len(request_hits) >= 2 or (len(request_hits) >= 1 and (deadline_match or pricing_match)):
            return ClassificationResult(
                classification=EmailClassification.CUSTOMER_REQUEST,
                confidence=0.92,
                reasons=[f"Detected specific RFP/Proposal request terms: {', '.join(request_hits[:4])}."],
                is_actionable=True,
                signals=signals,
            )

        if len(request_hits) >= 1 or (signals["question_count"] >= 1 and len(body_clean) > 10):
            return ClassificationResult(
                classification=EmailClassification.GENERAL_INQUIRY,
                confidence=0.80,
                reasons=["Direct inquiry from customer requiring informational response."],
                is_actionable=True,
                signals=signals,
            )

        # 7. Fallback to Automated/Informational notification if no customer questions or RFP terms
        return ClassificationResult(
            classification=EmailClassification.AUTOMATED_NOTIFICATION,
            confidence=0.70,
            reasons=["Informational message without actionable RFP terms or customer questions."],
            is_actionable=False,
            signals=signals,
        )
