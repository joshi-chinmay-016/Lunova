# Lunova — Local Development Setup Guide

This guide describes how to configure, run, and test Lunova entirely on a local development workstation without cloud dependencies or live Google credentials.

---

## 1. Prerequisites

- **Python:** 3.13+ installed on system PATH
- **Node.js:** v18+ or v20+ with npm
- **Database (Optional for unit tests, Required for full local server):** PostgreSQL 15+ with `pgvector` extension enabled.
  - *Note:* Automated backend tests run completely in-memory using SQLite test doubles and Mock Gmail clients without requiring a live database service.

---

## 2. Environment Configuration

Copy the sanitized environment configuration template:

```bash
# In the repository root
copy .env.example .env

# In the backend directory
copy backend\.env.example backend\.env
```

### Key Environment Variables (`backend/.env`)

```ini
PROJECT_NAME="Lunova API"
ENVIRONMENT="development"
DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5432/lunova

# AI Provider Settings (Defaults to offline deterministic mock)
LLM_PROVIDER=mock
LLM_MODEL=default-model
EMBEDDING_PROVIDER=mock
EMBEDDING_MODEL=text-embedding-004
EMBEDDING_DIMENSION=768
CHUNK_SIZE=1000
CHUNK_OVERLAP=200
RETRIEVAL_TOP_K=5

# Auth & Security
JWT_SECRET_KEY=supersecretkey_for_development_only
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60

# Gmail OAuth & Local Mock Testing
GMAIL_CLIENT_ID=your-google-oauth-client-id.apps.googleusercontent.com
GMAIL_CLIENT_SECRET=your-google-oauth-client-secret
GMAIL_REDIRECT_URI=http://localhost:8000/api/v1/integrations/gmail/callback
GMAIL_TOKEN_ENCRYPTION_KEY=your-32-byte-base64-fernet-key-here
```

> [!NOTE]
> `LLM_PROVIDER` and `EMBEDDING_PROVIDER` default to `mock`, allowing offline proposal analysis, citation retrieval, and response drafting without requiring a Gemini API key.

---

## 3. Database & Migrations

If a local PostgreSQL instance is running:

```bash
cd backend
python -m alembic upgrade head
```

To verify the linear revision chain:

```bash
python -m alembic history
```

To view the raw generated SQL without running against a live database:

```bash
python -m alembic upgrade base:head --sql
```

---

## 4. Starting the Application Locally

### 4.1 Backend (FastAPI)

```bash
cd backend
python -m uvicorn app.main:app --reload --port 8000
```
- API Documentation (Swagger UI): `http://localhost:8000/docs`
- Health check: `http://localhost:8000/health`

### 4.2 Frontend (Next.js 14)

```bash
cd frontend
npm install
npm run dev
```
- Frontend application runs on: `http://localhost:3000`

---

## 5. Local Authentication & Initial Bootstrapping

For local UI testing, a local bootstrap endpoint is provided:

- **Endpoint:** `POST http://localhost:8000/api/v1/auth/bootstrap`
- **Action:** Provisions the default tenant (`Lunetron`) and Admin user (`Sarah Jenkins`).
- **Default Credentials:**
  - **Email:** `admin@lunetron.com`
  - **Password:** `lunetron2026!`
- **Security Guard:** This endpoint is strictly rejected (`403 Forbidden`) if `ENVIRONMENT=production`.

---

## 6. Running Tests

### Backend Test Suite
```bash
cd backend
python -m pytest tests/ -v
```

### Frontend Typechecking & Production Build
```bash
cd frontend
npx tsc --noEmit
npm run build
```

---

## 7. Known Local Limitations

1. **Live Gmail Sending:** By design, no emails are dispatched to real mailboxes during local development. All integration flows use `MockGmailClient`.
2. **PostgreSQL pgvector:** If a native PostgreSQL daemon is not running on port 5432, full application API requests against `/proposals` will require database connectivity or mock dependency overrides. Unit/integration tests bypass this limitation via verified in-memory mocks.

