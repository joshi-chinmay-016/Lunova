# Lunova — Real Gmail Integration Troubleshooting Guide

Common issues encountered when deploying, configuring, or running the Gmail integration, along with root causes and remediation procedures.

---

## 1. OAuth & Authentication Issues

### 1.1 `redirect_uri_mismatch` (Google Error 400)
- **Symptom**: Google display error: `Error 400: redirect_uri_mismatch`.
- **Root Cause**: The redirect URI passed in the authorization request does not match the exact authorized redirect URI registered in Google Cloud Console.
- **Remediation**:
  1. Open Google Cloud Console > APIs & Services > Credentials.
  2. Edit your OAuth 2.0 Web Client.
  3. Ensure `http://localhost:8000/api/v1/integrations/gmail/callback` (or your exact production URL) is listed under **Authorized redirect URIs**. Trailing slashes and protocols (`http` vs `https`) must match exactly.

### 1.2 `access_denied` / User Canceled
- **Symptom**: Frontend displays an error notification: `Google OAuth was declined or canceled.`.
- **Root Cause**: The user clicked "Cancel" on Google's consent screen.
- **Remediation**: The user must click "Allow" on the Google consent screen to grant permissions.

### 1.3 `Invalid OAuth state` / CSRF State Validation Failure
- **Symptom**: Backend returns HTTP 400 `Invalid OAuth state`.
- **Root Cause**: The single-use CSRF state token expired (lifetime is 15 minutes) or was already consumed by an earlier request.
- **Remediation**: Return to Settings > Integrations and click "Connect Gmail" again to generate a fresh state token.

### 1.4 Expired or Revoked Refresh Token
- **Symptom**: Sync or send returns `invalid_grant` or token refresh fails.
- **Root Cause**: The user revoked access via Google Account Security settings, or Google revoked testing tokens (external user test tokens expire after 7 days if consent screen is in Testing mode).
- **Remediation**: Disconnect the account via Settings > Integrations and reconnect to obtain a new refresh token.

---

## 2. Ingestion & Synchronization Issues

### 2.1 Google Rate Limiting (HTTP 429)
- **Symptom**: High volume sync operations trigger `429 Too Many Requests`.
- **Root Cause**: Exceeded Gmail API user rate limit (250 quota units per user per second).
- **Remediation**: Built-in exponential backoff in `GmailClient._request_with_retry` will retry up to 3 times with exponential backoff and jitter. For batch imports, keep `max_messages` under 50.

### 2.2 Ingested Message Did Not Create a Proposal
- **Symptom**: Sync reports new emails ingested, but no new proposal appears on the dashboard.
- **Root Cause**:
  1. **Automated Noise**: The email came from a `no-reply@`, `postmaster@`, or had a subject like `Automatic reply: Out of Office` or `Invitation:`. These are saved to `emails` table but excluded from proposal creation to prevent clutter.
  2. **Existing Thread**: The incoming message was part of an existing conversation thread (`thread_id`) and was attached to the existing proposal instead of creating a duplicate.

### 2.3 Attachment Marked as `OVERSIZED` or `UNSUPPORTED`
- **Symptom**: Attachment is listed on the proposal with status `OVERSIZED` or `UNSUPPORTED`.
- **Root Cause**:
  - Lunova restricts individual attachment size to 25 MB to prevent memory exhaustion.
  - Unsupported file formats (e.g. executable `.exe`, `.tar.gz`) cannot be extracted for text.
- **Remediation**: This is expected safety behavior. The email and proposal are still ingested normally.

---

## 3. Outbound Sending & Dispatch Issues

### 3.1 Proposal in `DISPATCH_UNCERTAIN` State
- **Symptom**: The proposal card displays a prominent warning badge: `Dispatch Status Uncertain`.
- **Root Cause**: A network timeout, connection reset, or gateway timeout occurred after the email was submitted to Gmail. Because the message may have been delivered, automatic retries are blocked to prevent sending duplicate emails to prospective clients.
- **Remediation Workflow**:
  1. Open the connected Gmail account's **Sent Mail** folder (out-of-band check).
  2. If the email **WAS delivered**:
     - Click **Reconcile Dispatch** in the proposal workspace.
     - Select **Confirm Delivered**, enter the Gmail Message ID and verification notes.
     - The proposal transitions to `SENT`.
  3. If the email **WAS NOT delivered**:
     - Click **Reconcile Dispatch**.
     - Select **Reset for Resend** and enter explanatory notes.
     - The proposal resets to `APPROVED`. Authorized reviewers can click **Send via Gmail** again.

### 3.2 "Cannot send: proposal is in 'REVIEW_REQUIRED' state"
- **Symptom**: User clicks Send or API endpoint returns HTTP 400.
- **Root Cause**: The proposal has not been formally approved by an authorized reviewer.
- **Remediation**: Review the generated response draft and click **Approve Response** first. Only approved proposals can be dispatched.
