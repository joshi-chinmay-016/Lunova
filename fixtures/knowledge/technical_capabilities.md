<!-- SYNTHETIC TEST DATA — NOT REAL COMPANY INFORMATION -->
# NovaCorp Solutions — Technical Capabilities & Architecture Specifications

## Section 1: Authentication & Identity Management
- Supported Protocols: OAuth 2.0 with PKCE, OpenID Connect (OIDC), and SAML 2.0.
- Token Specifications: Short-lived asymmetric JWTs (RS256 or HS256) with 60-minute expiration.
- Role-Based Access Control: Granular Admin, Member, and Reviewer role enforcement at the HTTP route boundary.

## Section 2: Data Encryption & Sovereign Isolation
- Data at Rest: Encrypted using AES-256 with tenant-specific envelope keys.
- Data in Transit: TLS 1.3 enforced for all inbound and outbound network connections.
- Tenant Isolation: Strictly enforced at the SQL execution layer using parameterized queries (`WHERE company_id = :target_company_id`). Never filtered in memory.

## Section 3: Vector Embeddings & Model Orchestration
- Primary Embedding Model: Google Gemini text-embedding-004 with 768-dimensional float vectors.
- Reasoning Model: Google Gemini 3.5 Flash / Flash-Lite via official google-genai SDK.
- Fallback & Offline: Full offline execution supported using deterministic mock providers for test environments.

## Section 4: Performance & Scalability
- Throughput: Capable of analyzing 50 concurrent proposal documents per worker node.
- Ingestion Latency: P95 document extraction and chunking latency under 2.5 seconds for documents up to 50 pages.
- Memory Limits: Configured file size safety cap of 25 MB per document attachment.
