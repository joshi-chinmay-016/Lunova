# Component Boundaries

To ensure parallel development and maintain a clean architecture, the system is strictly divided into the **Platform Module** and the **AI Module**. Each module has well-defined responsibilities and strict boundaries.

## Platform Responsibilities
The Platform is responsible for the overall workflow, state management, persistence, and user interfaces. Developer 2 owns this module.

**Core Responsibilities:**
- **Company Management:** Managing tenants, company configurations, and isolating company data.
- **User/Authentication Concept:** Managing who can log in, their roles, and what company they belong to.
- **Email Ingestion & Dispatch:** Connecting to email providers (e.g., Gmail API), listening for incoming emails, and sending outgoing emails.
- **Proposal Lifecycle Management:** Tracking the state of a proposal from `RECEIVED` to `SENT` or `FAILED`.
- **Attachment Handling:** Storing and retrieving email attachments safely.
- **Knowledge Document Management:** Providing CRUD operations for uploading and managing documents in a company's knowledge base.
- **Human Review & Approval:** The frontend and backend logic that allows users to view, edit, and approve proposals.
- **Audit & History:** Logging all state changes, human edits, and emails sent for compliance and tracking.

**What the Platform MUST NOT own:**
- RAG internals (chunking strategy, vector search algorithms, embeddings).
- Prompt engineering for the LLM.
- Evaluating the confidence or grounding of the generated text.

## AI Responsibilities
The AI Module acts as an intelligence service that processes raw data and returns structured insights or generated text. Developer 1 owns this module.

**Core Responsibilities:**
- **Proposal Understanding:** Parsing the raw email and attachments to understand the context.
- **Requirement Extraction:** Identifying key constraints, questions, and requirements from the ingested proposal.
- **Knowledge Retrieval / RAG:** Taking extracted requirements, converting them into embeddings, and querying the vector database (`pgvector`) for relevant company knowledge.
- **Response Generation:** Formulating a professional, accurate proposal response using the retrieved context and an LLM.
- **Source Attribution:** Providing citations or links back to the specific knowledge base documents used to generate the response.
- **Confidence/Grounding Evaluation:** Assessing how confident the AI is in its response based on the available knowledge, flagging potential hallucinations.

**What the AI Module MUST NOT own:**
- Connecting directly to the Gmail API or sending emails.
- Mutating the primary proposal state in the database directly (it should return results to the Platform, which updates the state).
- Managing user sessions, authentication, or general UI workflows.
- Company billing or general tenant configuration (aside from what's necessary to isolate vector searches).

## The Boundary Interface
The interaction between the Platform and the AI Module should be handled via clear internal service interfaces (or function boundaries in the modular monolith). 

1. **Triggering AI:** The Platform calls the AI Module passing: `company_id`, `proposal_id`, `raw_text`, and `attachments`.
2. **AI Processing:** The AI Module does its RAG and LLM calls.
3. **Returning Results:** The AI Module returns a structured object (e.g., a Pydantic model) containing the `generated_draft`, `extracted_requirements`, `sources_used`, and `confidence_score`.
4. **State Update:** The Platform receives this object and updates the database.
