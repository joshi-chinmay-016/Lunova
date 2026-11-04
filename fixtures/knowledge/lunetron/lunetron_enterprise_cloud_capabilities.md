# Lunetron — Enterprise Cloud & Infrastructure Capabilities

## Multi-Cloud Architecture & Portability
Lunetron engineers and deploys high-resilience, portable workloads across major cloud providers:
- **Amazon Web Services (AWS)**: Elastic Kubernetes Service (EKS), RDS Aurora PostgreSQL, VPC Peering, Direct Connect, KMS, S3, IAM Identity Center.
- **Google Cloud Platform (GCP)**: Google Kubernetes Engine (GKE), Cloud SQL, Vertex AI integration, Cloud KMS, Cloud Armor.
- **Microsoft Azure**: Azure Kubernetes Service (AKS), Azure Database for PostgreSQL, Azure Key Vault, Entra ID SSO.

## Infrastructure as Code & GitOps Automation
- **Declarative Infrastructure**: 100% of infrastructure provisioning is codified in modular, version-controlled Terraform and OpenTofu templates.
- **Continuous Delivery**: Zero-downtime blue/green and canary deployments powered by ArgoCD, Flux, and GitHub Actions.
- **Immutable Artifacts**: OCI-compliant container images signed with Cosign and scanned for vulnerabilities via Trivy in pre-merge CI stages.

## Persistence & High Availability
- **PostgreSQL High Availability**: Automated multi-AZ failover configurations with streaming replication, connection pooling (PgBouncer), and zero-data-loss point-in-time recovery (PITR).
- **Vector Search Infrastructure**: Production `pgvector` indexing with HNSW (Hierarchical Navigable Small World) indices, configured with 768-dimensional normalized embedding vectors.
- **Disaster Recovery SLAs**:
  - Recovery Point Objective (RPO): Less than 5 minutes.
  - Recovery Time Objective (RTO): Less than 15 minutes across multi-region configurations.

## Observability & Site Reliability Engineering
- Comprehensive telemetry stacks utilizing OpenTelemetry, Prometheus, Grafana, and distributed Jaeger tracing.
- Structured JSON logging with automated correlation IDs traversing from API edge gateways to database queries.
- Automated SLO/SLI tracking with real-time incident alerting via PagerDuty and secure webhooks.
