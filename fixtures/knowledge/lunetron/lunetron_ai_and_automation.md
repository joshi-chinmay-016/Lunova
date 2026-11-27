# Lunetron AI & Intelligent Automation Practice

## 1. Practice Overview
Lunetron's Artificial Intelligence and Workflow Automation practice builds sovereign, citation-grounded enterprise AI systems. Founded on the principle that AI must be **evidence-backed and deterministic**, Lunetron rejects unverified probabilistic text generation for mission-critical enterprise workflows such as proposal responses, vendor security questionnaires, legal contracts, and financial audits.

---

## 2. Core Capabilities & Architecture

### A. Enterprise Retrieval-Augmented Generation (RAG)
- **High-Fidelity Document Ingestion**: Ingests multi-page PDFs, Microsoft Word (.docx), Excel spreadsheets (.xlsx), and raw email threads.
- **Structural Semantic Chunking**: Deconstructs complex documents preserving tables, section headers, legal clauses, and footnotes with precise page coordinates.
- **Vector Embeddings & Strict Filtering**: Utilizes state-of-the-art dense embeddings (768-dimension and 1536-dimension) stored in tenant-partitioned vector databases (PostgreSQL with `pgvector`).
- **Cosine Thresholding**: Enforces strict cosine similarity filtering (threshold >= 0.85) to eliminate low-relevance hallucinations.

### B. Autonomous AI Agents & Multi-Stage Pipelines
Lunova proposal intelligence operates as a 5-stage sequential agent pipeline:
1. **Ingest Agent**: Captures unstructured RFPs via email webhooks or document uploads.
2. **Decomposition Agent**: Deconstructs questions into atomic obligations across security, technical architecture, SLAs, and commercial pricing.
3. **Retrieval Agent**: Semantically queries indexed company evidence under strict tenant quarantine.
4. **Synthesis Agent**: Generates evidence-backed proposal responses where every assertion links directly to verified citations.
5. **Human Gate Agent**: Requires explicit, multi-factor review and authorization before any proposal response is dispatched.

### C. Missing Information Detection & Boundary Visibility
- When an inbound questionnaire requests features or SLAs not present in indexed documents, Lunetron's pipeline flags the gap as an explicit **Boundary Condition / Missing Detail**.
- The system never fabricates dates, certifications, or architectural capabilities. It highlights gaps in high-contrast amber for human subject matter expert resolution.

---

## 3. Technology Stack & Frameworks
- **Vector Databases**: PostgreSQL (`pgvector`), Chroma, Pinecone.
- **LLM Foundation Models**: Google Gemini (Gemini 1.5 Pro / Flash), Anthropic Claude, OpenAI GPT-4o.
- **Evaluation Frameworks**: Custom RAG evaluation harnesses testing context precision, context recall, faithfulness, and answer relevance.
- **Integration Webhooks**: Bidirectional connectors for Google Workspace (Gmail API), Microsoft Outlook, Slack, and Salesforce.
