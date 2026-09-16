# Knowledge Base Architecture

This document defines the conceptual knowledge representation, vector indexing, and Retrieval-Augmented Generation (RAG) architecture for **Lunova**.

---

## 1. RAG Ingestion & Retrieval Pipeline

```
                ┌──────────────────────────────┐
                │      Company Knowledge       │  (MVP: Lunetron documentation)
                └──────────────┬───────────────┘
                               │
                               ▼
                ┌──────────────────────────────┐
                │          Documents           │  (PDFs, Whitepapers, Spec Sheets, Past RFPs)
                └──────────────┬───────────────┘
                               │
                               ▼
                ┌──────────────────────────────┐
                │      Content Extraction      │  (Text parsing & metadata extraction)
                └──────────────┬───────────────┘
                               │
                               ▼
                ┌──────────────────────────────┐
                │           Chunking           │  (Semantic or sliding window chunking)
                └──────────────┬───────────────┘
                               │
                               ▼
                ┌──────────────────────────────┐
                │          Embeddings          │  (Dense vector representations)
                └──────────────┬───────────────┘
                               │
                               ▼
                ┌──────────────────────────────┐
                │       Vector Retrieval       │  (PostgreSQL pgvector cosine similarity)
                └──────────────┬───────────────┘
                               │
                               ▼
                ┌──────────────────────────────┐
                │      Company-Scoped RAG      │  (Filtered context injected into prompts)
                └──────────────────────────────┘
```

---

## 2. Key Architectural Tenets

1. **Company-Scoped Indexing**:
   Every chunk stored in PostgreSQL `pgvector` contains an indexed foreign key to `company_id`. During vector similarity searches, the tenant ID is an immutable filter:
   ```sql
   SELECT chunk_id, content, 1 - (embedding <=> :query_vector) AS similarity
   FROM knowledge_chunks
   WHERE company_id = :company_id
   ORDER BY embedding <=> :query_vector
   LIMIT :top_k;
   ```

2. **MVP Scope: Lunetron Knowledge Base**:
   For the MVP, only Lunetron's technical documentation, past proposals, and capabilities collateral will be indexed.

3. **Deferred Technology Selections**:
   In accordance with architectural guidelines, the following decisions are deliberately deferred until representative Lunetron documents are reviewed:
   - **Document parsing libraries** (e.g., PyMuPDF, Unstructured, pypdf).
   - **Chunking strategies** (e.g., token-based, recursive character, Markdown header splitting).
   - **Embedding models** (e.g., OpenAI `text-embedding-3`, Cohere, HuggingFace local models).
   - **Foundation LLMs** (e.g., Claude 3.5 Sonnet, GPT-4o, Gemini 1.5 Pro).
