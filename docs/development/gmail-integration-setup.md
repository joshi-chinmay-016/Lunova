# Lunova — Real Gmail Integration Setup Guide

This guide walks through configuring real Google OAuth 2.0 credentials and connecting corporate Gmail accounts to Lunova.

---

## 1. Google Cloud Console Configuration

### 1.1 Create or Select a GCP Project
1. Navigate to the [Google Cloud Console](https://console.cloud.google.com/).
2. Create a new project (e.g., `Lunova Enterprise Development`) or select your existing project.

### 1.2 Enable Required APIs
In **APIs & Services > Library**, search for and enable:
- **Gmail API** (`gmail.googleapis.com`)
- **Google People API** or **OAuth2 API** (`oauth2.googleapis.com`)

### 1.3 Configure OAuth Consent Screen
1. Go to **APIs & Services > OAuth consent screen**.
2. Select **Internal** (for Google Workspace organizations) or **External** (for testing with personal Gmail accounts).
3. Fill in mandatory application info:
   - App name: `Lunova Proposal Agent`
   - User support email: your organization email
   - Developer contact email: your organization email
4. Under **Scopes**, add the following 3 minimal scopes:
   - `https://www.googleapis.com/auth/gmail.readonly` (Read incoming RFP emails & attachments)
   - `https://www.googleapis.com/auth/gmail.send` (Dispatch human-approved proposals)
   - `https://www.googleapis.com/auth/userinfo.email` (Identify connected account address)
5. Save and add your test email account to **Test Users** if using External user type.

### 1.4 Create OAuth 2.0 Client Credentials
1. Go to **APIs & Services > Credentials > Create Credentials > OAuth client ID**.
2. Application type: **Web application**.
3. Name: `Lunova Backend OAuth Client`.
4. Authorized redirect URIs:
   - Local development: `http://localhost:8000/api/v1/integrations/gmail/callback`
   - Production / Staging: `https://your-api-domain.com/api/v1/integrations/gmail/callback`
5. Click **Create** and copy your **Client ID** and **Client Secret**.

---

## 2. Environment Variables Configuration

Configure your `.env` or `backend/.env` file. Both `GOOGLE_*` and `GMAIL_*` environment variable prefixes are supported transparently:

```env
# ==============================================================================
# Google OAuth 2.0 Credentials (Supported prefixes: GOOGLE_* or GMAIL_*)
# ==============================================================================
GOOGLE_CLIENT_ID=your-google-oauth-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-your-google-oauth-client-secret
GOOGLE_REDIRECT_URI=http://localhost:8000/api/v1/integrations/gmail/callback
FRONTEND_URL=http://localhost:3000

# ==============================================================================
# Token Encryption Key (Fernet 32-byte urlsafe base64)
# Generate with: python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
# ==============================================================================
ENCRYPTION_KEY=your-generated-fernet-key-here
```

---

## 3. Connecting Gmail via the Web UI

1. Start the Lunova backend (`uvicorn app.main:app --reload --port 8000`) and frontend (`npm run dev` on port 3000).
2. Log into Lunova as an **Administrator**.
3. In the left navigation, go to **Settings** and click the **Integrations** tab.
4. Locate the **Google Workspace / Gmail** card and click **Connect Gmail**.
5. You will be redirected to Google's consent screen. Grant the requested permissions.
6. Upon consent, Google will redirect back to Lunova's backend callback endpoint, which encrypts the tokens, saves the connection, and redirects your browser to:
   `http://localhost:3000/settings?tab=integrations&connected=gmail`
7. The status card will update to show **Connected: your-email@yourdomain.com** along with a **Sync Inbox** button.

---

## 4. Triggering Inbox Synchronization

- Click **Sync Inbox** in the UI to query your inbox for incoming proposal inquiries.
- The UI will display a live summary toast:
  `"Inbox synchronized: X new email(s) ingested, Y proposal inquiry(ies) created, Z duplicate(s) skipped."`
- Ingested proposals appear immediately under the **Proposals** tab for AI review and response generation.
