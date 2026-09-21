import pytest
from app.core.config import settings
from app.models import Base

@pytest.mark.asyncio
async def test_health_endpoint(async_client):
    response = await async_client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok", "project": settings.PROJECT_NAME}

def test_models_importable():
    # Simple test to ensure all models are imported into Base.metadata
    assert "companies" in Base.metadata.tables
    assert "users" in Base.metadata.tables
    assert "proposals" in Base.metadata.tables
    assert "emails" in Base.metadata.tables
    assert "knowledge_documents" in Base.metadata.tables
    assert "reviews" in Base.metadata.tables
    assert "audit_logs" in Base.metadata.tables
