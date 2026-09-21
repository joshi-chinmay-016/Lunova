# Architecture Decisions

This document records the major architectural decisions made during Phase 0 of the AI Proposal Agent project.

## Accepted Decisions

### 1. Modular Monolith for MVP
- **Decision:** Build the backend as a single FastAPI application with strict internal module boundaries rather than separate microservices.
- **Reason:** A two-person team working on an MVP needs velocity. Managing distributed tracing, network latency, and complex deployments of microservices would slow development unnecessarily.
- **Consequence:** The codebase must be strictly organized into logical modules (Platform vs. AI) to prevent spaghetti code and allow for potential future extraction.

### 2. FastAPI Backend & Next.js Frontend
- **Decision:** Use FastAPI (Python) for the backend and Next.js (TypeScript) for the frontend.
- **Reason:** FastAPI provides excellent async support, type validation (Pydantic), and is the industry standard for AI/ML integrations. Next.js provides a robust React framework for the reviewer UI.
- **Consequence:** Team members must be comfortable with both Python and TypeScript ecosystems.

### 3. PostgreSQL & pgvector
- **Decision:** Use PostgreSQL as the single datastore, utilizing the `pgvector` extension for embeddings.
- **Reason:** Keeps infrastructure simple by avoiding the need for a separate vector database (like Pinecone or Milvus) alongside a relational database.
- **Consequence:** We rely on Postgres for both relational integrity (users, companies, proposals) and semantic search.

### 4. Gmail API Initially, Abstracted Interface
- **Decision:** Use the Gmail API for the MVP, but hide it behind an abstract `EmailProvider` interface.
- **Reason:** Lunetron uses Gmail, but future tenants might use Office 365 or standard IMAP/SMTP.
- **Consequence:** The core platform will not contain Gmail-specific logic; it will interact with abstract email ingestion and sending methods.

### 5. No Premature Infrastructure (Redis, Celery, Kafka, K8s)
- **Decision:** Do not use Redis, Celery, Kafka, or Kubernetes for the MVP. Use FastAPI's background tasks or a simple async worker if asynchronous processing is strictly required.
- **Reason:** Minimizes operational complexity and hosting costs.
- **Consequence:** If proposal volume spikes massively, we may need to introduce a dedicated message queue (like Celery/Redis) later to handle long-running AI tasks.

### 6. Company/Tenant Concept from Day One
- **Decision:** Implement multi-tenancy at the database level (`company_id` on all major tables) from the start.
- **Reason:** Retrofitting multi-tenancy into a single-tenant system is notoriously difficult.
- **Consequence:** All queries and AI RAG retrievals must explicitly filter by `company_id`.

### 7. AI Mocking for Parallel Development
- **Decision:** Use mocked interfaces for the AI module and Platform module during initial development.
- **Reason:** Developer 1 (AI) and Developer 2 (Platform) must work simultaneously without blocking each other.
- **Consequence:** Both developers must agree on the data contracts (Pydantic schemas) early on.

## Open Decisions

The following decisions intentionally remain open pending further information.

- **AI Provider Selection:** OpenAI, Anthropic, or an open-source model?
- **Embedding Model:** Which model to use for vector generation?
- **Hosting Provider:** AWS, GCP, Vercel, Render, etc.

## Information Required From Lunetron

Before finalizing the implementation plan, we need the following information from Lunetron:

1. **Email Access:** Will they provide a dedicated Google Workspace service account, or do we need to implement OAuth for a specific user inbox?
2. **Email Volume & Flow:** How many proposals are received daily? Are they sent to a shared inbox (e.g., `proposals@lunetron.com`)?
3. **Attachment Formats:** What file types are standard in their requests? (PDFs, Word docs, Excel sheets?)
4. **Knowledge Base Formats:** What format is their existing knowledge base in? (Confluence, Notion, raw PDFs, Google Drive?)
5. **Response Format:** Does the generated proposal need to be a plain text email, an HTML email, or an attached PDF?
6. **Approval Workflow:** Does the approval require multiple steps/people, or just one reviewer?
7. **Security/Data Compliance:** Are there specific data retention policies or regulatory requirements (e.g., GDPR, HIPAA, ITAR) we must adhere to?
