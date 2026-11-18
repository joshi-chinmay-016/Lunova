from pathlib import Path
from uuid import uuid4
import pytest
from unittest.mock import AsyncMock, MagicMock

from app.platform.schemas.document import DocumentCreate
from app.platform.services.document_service import DocumentService


def test_all_lunetron_fixtures_are_quarantined():
    """Verify that every Lunetron fixture document has an explicit quarantine banner."""
    fixtures_dir = Path(__file__).resolve().parents[3] / "fixtures" / "knowledge" / "lunetron"
    md_files = list(fixtures_dir.glob("*.md"))
    # Exclude README.md
    doc_files = [f for f in md_files if f.name != "README.md"]

    assert len(doc_files) == 8, f"Expected 8 Lunetron fixture docs, found {len(doc_files)}"

    for fpath in doc_files:
        content = fpath.read_text(encoding="utf-8")
        assert "QUARANTINE_STATUS: BENCHMARK_ONLY" in content, (
            f"File {fpath.name} is missing the quarantine marker"
        )
        assert "SYNTHETIC BENCHMARK FIXTURE" in content, (
            f"File {fpath.name} is missing synthetic benchmark banner"
        )


@pytest.mark.asyncio
async def test_document_service_rejects_quarantined_benchmark_fixtures():
    """Verify DocumentService blocks ingestion of synthetic benchmark fixtures into knowledge base."""
    mock_db = AsyncMock()
    company_id = uuid4()

    fixtures_dir = Path(__file__).resolve().parents[3] / "fixtures" / "knowledge" / "lunetron"
    sample_file = fixtures_dir / "lunetron_standard_pricing_models.md"
    quarantined_content = sample_file.read_text(encoding="utf-8")

    doc_data = DocumentCreate(
        name="Unverified Lunetron Pricing",
        doc_type="md",
        source="fixtures/knowledge/lunetron/lunetron_standard_pricing_models.md",
        content=quarantined_content,
    )

    with pytest.raises(ValueError, match="quarantined as synthetic benchmark data"):
        await DocumentService.ingest_document(
            db=mock_db,
            data=doc_data,
            company_id=company_id,
        )


@pytest.mark.asyncio
async def test_document_service_accepts_verified_corporate_document():
    """Verify DocumentService accepts legitimate, verified enterprise documentation."""
    mock_db = AsyncMock()
    mock_db.add = MagicMock()
    company_id = uuid4()

    clean_content = (
        "# Official Production Architecture Guidelines\n\n"
        "This document contains verified production technical guidance approved by engineering."
    )

    doc_data = DocumentCreate(
        name="Verified Production Architecture",
        doc_type="md",
        source="https://wiki.lunetron.internal/arch",
        content=clean_content,
    )

    doc = await DocumentService.ingest_document(
        db=mock_db,
        data=doc_data,
        company_id=company_id,
    )

    assert doc.name == "Verified Production Architecture"
    assert doc.company_id == company_id
    assert mock_db.add.called
    assert mock_db.commit.called
