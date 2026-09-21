# Lunova Backend Foundation (Phase 1)

This repository contains the FastAPI backend for the AI Proposal Agent.

## Prerequisites
- Python 3.11+
- Docker & Docker Compose (for the PostgreSQL + pgvector database)

## Local Development Setup

1. **Start the Database**
   ```bash
   docker compose up -d
   ```
   *This starts a PostgreSQL 16 database with the pgvector extension enabled.*

2. **Setup Environment Variables**
   ```bash
   cp .env.example .env
   ```
   *Modify the `.env` file if your local setup requires different credentials.*

3. **Install Dependencies**
   ```bash
   pip install -e .[dev]
   ```

4. **Run Database Migrations**
   ```bash
   alembic upgrade head
   ```

5. **Start the API Server**
   ```bash
   uvicorn app.main:app --reload
   ```

6. **Run Tests**
   ```bash
   pytest
   ```

## Project Structure
- `app/`: Core FastAPI application
  - `api/`: Route definitions
  - `core/`: Config and database dependencies
  - `models/`: SQLAlchemy Domain Models
  - `schemas/`: Pydantic contracts
  - `repositories/`: Database abstraction
  - `services/`: Business logic
- `platform/`: Workflows and non-AI logic (Developer 2)
- `intelligence/`: RAG, LLM calls, and AI logic (Developer 1)
- `migrations/`: Alembic database migration scripts
- `tests/`: Pytest suite
