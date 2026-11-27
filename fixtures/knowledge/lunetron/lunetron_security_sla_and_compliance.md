# Lunetron Security, Compliance & Service Level Agreements

## 1. Enterprise Trust & Security Safeguards
Lunetron Web Services LLP adheres to enterprise-grade security standards across all client engagements, SaaS architectures, and cloud deployments.

### A. Encryption Standards
- **Data in Transit**: Enforced TLS 1.3 with modern cipher suites across all public web endpoints and internal service communications.
- **Data at Rest**: AES-256 encryption across all PostgreSQL database volumes, S3 document storage buckets, and vector indexes.
- **Customer Key Management**: Optional customer-managed keys (CMK) under AWS KMS with enforced 90-day auto-rotation policies.

### B. Tenant Data Isolation
- **Multi-Tenant Boundary Enforcement**: Strict tenant isolation prevents cross-tenant data bleed. Every database query, vector search, and document chunk is scoped by verified `company_id`.
- **Zero Public Model Training**: Customer enterprise documentation, proprietary codebases, and proposal data are strictly quarantined and never used to train public foundation models.

---

## 2. Service Level Agreements (SLAs)

### A. Availability Commitments
- **SaaS Platform Uptime**: Guaranteed 99.95% monthly operational uptime.
- **Disaster Recovery**:
  - Recovery Time Objective (RTO): Under 60 seconds with automated DNS failover.
  - Recovery Point Objective (RPO): Zero data loss with synchronous database replication across availability zones.

### B. Support Response Matrix
- **Severity 1 (Critical Outage)**: Senior engineering response in **under 15 minutes**, 24/7/365.
- **Severity 2 (High Degradation)**: Response in under 1 business hour.
- **Severity 3 (Standard Inquiries)**: Response in under 4 business hours.

---

## 3. Official Corporate Contact & Escalation Channels
- **Corporate Entity**: Lunetron Web Services LLP
- **Registered Office**: No. 17, 7th Main Road, Indira Nagar II Stage, Hoysala Nagar, Indiranagar, Bengaluru, Karnataka 560038, India
- **Support Email**: `support@lunetron.com`
- **General Inquiries**: `info@lunetron.com`
- **Proposal & Contract Dispatch**: `proposals@lunetron.com`
- **Phone / WhatsApp Escalations**: +91 74830 65852 / +91 74009 35551
- **Official Web Portals**: [lunetron.com](https://lunetron.com) • [lunetron.in](https://lunetron.in)
