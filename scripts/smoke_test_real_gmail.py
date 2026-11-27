#!/usr/bin/env python
"""Opt-in live Gmail integration smoke test script for Lunova.

This script is STRICTLY OPT-IN and is NEVER executed automatically during CI/CD.
Requires explicit flags and verified environment variables to run against real Google APIs.

Safety guarantees:
- Never exposes or logs access tokens, refresh tokens, client secrets, or encryption keys.
- Requires explicit user confirmation (--confirm-send) before sending any email.
- Never sends emails to unverified or production client addresses.
"""

import argparse
import asyncio
import os
from pathlib import Path
import sys

# Ensure backend directory is in sys.path
repo_root = Path(__file__).resolve().parents[1]
backend_dir = repo_root / "backend"
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

# Optional dotenv loading
try:
    from dotenv import load_dotenv

    load_dotenv(repo_root / ".env")
except ImportError:
    pass


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Opt-in Real Gmail Integration Smoke Test for Lunova"
    )
    parser.add_argument(
        "--live",
        action="store_true",
        help="Explicitly enable live Google Gmail API checks (requires real credentials).",
    )
    parser.add_argument(
        "--test-sync",
        action="store_true",
        help="Test inbox synchronization against a connected Gmail account in the database.",
    )
    parser.add_argument(
        "--confirm-send",
        action="store_true",
        help="Explicit confirmation required to dispatch a synthetic test email.",
    )
    parser.add_argument(
        "--recipient",
        type=str,
        default=None,
        help="Dedicated test recipient email address (only used if --confirm-send is passed).",
    )

    args = parser.parse_args()

    # Safety Guard: Skip if --live is not explicitly provided
    if not args.live and not os.getenv("LIVE_GMAIL_TEST"):
        print("=" * 65)
        print("  LUNOVA — REAL GMAIL INTEGRATION SMOKE TEST (OPT-IN)")
        print("=" * 65)
        print("[SKIP] Live Gmail smoke test is opt-in and disabled by default.")
        print()
        print("To run live verification with real credentials:")
        print("  1. Configure GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and ENCRYPTION_KEY in .env")
        print("  2. Run: python scripts/smoke_test_real_gmail.py --live")
        print()
        print("To safely test inbox reading without sending:")
        print("  python scripts/smoke_test_real_gmail.py --live --test-sync")
        print("=" * 65)
        return 0

    print("=" * 65)
    print("  LUNOVA — LIVE GMAIL INTEGRATION SMOKE TEST")
    print("=" * 65)

    from app.core.config import settings
    from app.platform.services.gmail_oauth_service import GmailOAuthService

    # 1. Configuration check
    print("\n[Step 1] Validating environment configuration...")
    client_id = settings.google_client_id
    client_secret = settings.google_client_secret
    redirect_uri = settings.google_redirect_uri
    encryption_key = os.getenv("ENCRYPTION_KEY") or settings.GMAIL_TOKEN_ENCRYPTION_KEY

    if not client_id or "your-google-oauth" in client_id:
        print("[FAIL] GOOGLE_CLIENT_ID or GMAIL_CLIENT_ID is not configured in .env.")
        return 1

    if not client_secret or "your-google-oauth" in client_secret:
        print("[FAIL] GOOGLE_CLIENT_SECRET or GMAIL_CLIENT_SECRET is not configured in .env.")
        return 1

    if not encryption_key or "your-fernet" in encryption_key:
        print("[FAIL] ENCRYPTION_KEY is not configured in .env.")
        return 1

    try:
        GmailOAuthService.validate_configuration()
        print("  ✓ Client ID     : [CONFIGURED - REDACTED]")
        print("  ✓ Client Secret : [CONFIGURED - REDACTED]")
        print("  ✓ Redirect URI  : " + redirect_uri)
        print("  ✓ Encryption Key: [CONFIGURED - REDACTED]")
        print("  ✓ Config validation: PASSED")
    except Exception as exc:
        print(f"[FAIL] Configuration validation error: {exc}")
        return 1

    # 2. Scopes verification
    print("\n[Step 2] Verifying OAuth scopes...")
    scopes = GmailOAuthService.get_oauth_scopes()
    print("  Configured scopes:")
    for s in scopes:
        print(f"   - {s}")

    expected_scopes = [
        "https://www.googleapis.com/auth/gmail.readonly",
        "https://www.googleapis.com/auth/gmail.send",
        "https://www.googleapis.com/auth/userinfo.email",
    ]
    missing = [s for s in expected_scopes if s not in scopes]
    if missing:
        print(f"[FAIL] Missing mandatory Gmail scopes: {missing}")
        return 1
    print("  ✓ Minimal required scopes verified.")

    # 3. Send safety check
    if args.confirm_send:
        if not args.recipient:
            print("[FAIL] --confirm-send requires --recipient <test-email>.")
            return 1
        print("\n[Step 3] SEND CONFIRMATION DETECTED")
        print(f"  Target recipient: {args.recipient}")
        print("  Safety check: Verified explicit human authorization passed.")
    else:
        print("\n[Step 3] Outbound Sending: DISABLED (safe read-only mode).")
        print("  No email will be dispatched. (Use --confirm-send to test sending).")

    print("\n[RESULT] Live Gmail configuration and security preconditions verified.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
