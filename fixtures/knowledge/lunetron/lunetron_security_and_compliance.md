<!-- SYNTHETIC BENCHMARK FIXTURE — UNVERIFIED TEST DATA -->
<!-- QUARANTINE_STATUS: BENCHMARK_ONLY -->
<!-- WARNING: NOT FOR PRODUCTION INGESTION. DO NOT REPRESENT AS VERIFIED LUNETRON FACTS. -->

# Lunetron — Security, Compliance & Data Governance

## Compliance Certifications & Standards
Lunetron maintains rigorous compliance credentials verified by accredited independent third-party auditors:
- **SOC 2 Type II**: Verified annually across all 5 Trust Services Criteria (Security, Availability, Processing Integrity, Confidentiality, and Privacy).
- **ISO/IEC 27001:2022**: Certified Information Security Management System (ISMS) governing software engineering, cloud hosting, and data management.
- **GDPR & CCPA**: Full compliance with European and Californian data protection regulations, including automated data subject access requests (DSAR) and Right to be Forgotten deletion protocols.
- **HIPAA Readiness**: Capable of signing Business Associate Agreements (BAAs) with healthcare clients, featuring dedicated audit trails and PHI masking filters.

## Cryptographic Architecture & Data Protection
- **Data at Rest**: Encrypted utilizing AES-256-GCM across all storage volumes, databases, backups, and vector representations.
- **Data in Transit**: Enforced TLS 1.3 encryption across all public and internal service communications; obsolete SSL and early TLS ciphers are disabled.
- **Envelope Encryption**: Third-party OAuth tokens, client credentials, and customer secrets are protected using Fernet symmetric encryption with automated key rotation capabilities.
- **Zero Model Training**: Customer proprietary data and knowledge base documents are strictly isolated; Lunetron contracts stipulate that customer data is never used to train foundational AI models.

## Identity & Role-Based Access Control (RBAC)
- **Authentication**: JWT-based session management with configurable expiration, stateless signature verification, and support for enterprise SAML/OAuth2 SSO providers (Okta, Entra ID, Google Workspace).
- **Role Hierarchy**: Strict role segmentation across administrative, reviewer/member, and viewer access rights.
- **Immutable Audit Logging**: Every critical lifecycle event (user authentication, token refresh, document ingestion, proposal review, approval, and email dispatch) is recorded in tamper-evident audit logs.
