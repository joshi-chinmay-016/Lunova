# Lunetron SaaS & Cloud Engineering Architecture

## 1. Engineering Philosophy
Lunetron Web Services LLP designs software with a strong focus on high-performance execution, sub-second latency, responsive human interfaces, and multi-tenant data isolation. Applications are engineered from day one to handle enterprise workloads with zero cross-tenant data leakage.

---

## 2. Modern Application Stack

### A. Frontend Layer
- **Framework**: Next.js (App Router) with TypeScript.
- **Styling & Motion**: Tailwind CSS with custom design tokens, Framer Motion for spring physics and layout transitions.
- **Typography & High-Density UI**: Clean typography pairings (`Space Grotesk` for display headings, `Plus Jakarta Sans` for body, `JetBrains Mono` for telemetry and citations).
- **Client State & Caching**: TanStack Query (React Query) for optimistic mutations, server state synchronization, and background refetching. Zustand for UI state management.

### B. Backend & API Services
- **Framework**: Python 3.12 with FastAPI for asynchronous, high-throughput microservices.
- **API Protocols**: RESTful JSON endpoints with OpenAPI / Swagger documentation, Webhook event subscribers, and WebSocket hot updates.
- **Background Task Workers**: Celery / Redis and native asyncio background workers for document chunking, embedding generation, and email dispatch.

### C. Persistence & Data Partitioning
- **Primary Database**: PostgreSQL with Asyncpg connection pooling and SQLAlchemy ORM.
- **Tenant Isolation**: Row-Level Security (RLS) and company foreign key enforcements across every table.
- **Caching & Rate Limiting**: In-memory Redis caching for authenticated user sessions and rate-limited API gateways.

---

## 3. Cloud Infrastructure & DevOps (AWS & Vercel)
- **Containerization**: Docker containers orchestrating backend workers and vector indexing jobs.
- **Edge Delivery**: Vercel Edge Network for worldwide frontend asset delivery and sub-50ms TTFB.
- **Cloud Infrastructure (AWS)**:
  - **Compute**: AWS ECS / EKS container clusters with automatic scaling.
  - **Storage**: AWS S3 encrypted buckets for multi-tenant document attachments.
  - **Key Management**: AWS KMS with customer-managed keys (CMK) and 90-day automated rotation.
  - **Database**: AWS RDS Multi-AZ PostgreSQL with automated snapshots and cross-region replication.
- **CI/CD Pipeline**: GitHub Actions running automated linting, TypeScript compilation, Pytest unit tests, and seamless blue/green deployments.
