# Multi-Tenancy

Although the MVP focuses on a single customer (Lunetron), the architecture is designed from day one to support multiple companies (tenants).

## Conceptual Model

At the core of the system is the `Company` entity. Almost all other data in the system belongs to a company.

```text
Company
 ├── Users (Employees reviewing proposals)
 ├── Email Configuration (Credentials/tokens for ingestion & sending)
 ├── Proposals (Received requests and generated drafts)
 ├── Knowledge Documents (PDFs, docs used for RAG)
 └── Settings (System preferences, AI tone guidelines)
```

## Database Architecture
For the MVP, we will use a **Shared PostgreSQL Database** with logical separation. 
- There will not be separate databases or schemas per company to keep infrastructure simple.
- Every relevant table (e.g., `users`, `proposals`, `documents`, `document_chunks`) will have a `company_id` foreign key.

## Data Isolation

### Platform Isolation
All queries in the backend must explicitly filter by `company_id`. 
- When an API endpoint is hit, the authenticated user's `company_id` is extracted from their session/token.
- All database queries append `WHERE company_id = ?` to ensure users cannot see proposals or settings from another company.

### AI Knowledge Retrieval Isolation
This is the most critical isolation boundary. The AI must *never* retrieve knowledge from Company A when generating a proposal for Company B.

- We are using `pgvector` for embedding storage.
- The `document_chunks` table will store the vector embeddings and will include a `company_id` column.
- During the RAG process, the vector similarity search MUST include a hard filter on `company_id`.

**Example SQL Concept:**
```sql
SELECT content 
FROM document_chunks 
WHERE company_id = :current_company_id 
ORDER BY embedding <-> :query_embedding 
LIMIT 5;
```

By enforcing `company_id` at the database level for vector searches, we guarantee that the LLM is only provided context from the correct tenant.
