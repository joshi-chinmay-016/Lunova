from datetime import datetime, timezone
import io
import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from uuid import uuid4
from httpx import AsyncClient, ASGITransport

from app.main import app
from app.core.database import get_db
from app.models.user import UserRole
from app.models.document import KnowledgeDocument
from app.auth.services.jwt_service import JWTService


@pytest.mark.asyncio
async def test_knowledge_upload_no_token_returns_401():
    """Verify that uploading without Authorization header fails with 401 Not authenticated."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # 1. File upload route
        files = {"file": ("test.txt", io.BytesIO(b"Hello Lunova knowledge base"), "text/plain")}
        res = await client.post("/api/v1/knowledge/upload", files=files)
        assert res.status_code == 401
        assert res.json().get("detail") == "Not authenticated"

        # 2. JSON document route
        res_json = await client.post(
            "/api/v1/knowledge/documents",
            json={"name": "test.txt", "doc_type": "txt", "content": "Hello Lunova"}
        )
        assert res_json.status_code == 401
        assert res_json.json().get("detail") == "Not authenticated"


@pytest.mark.asyncio
async def test_knowledge_upload_invalid_token_returns_401():
    """Verify that uploading with an invalid/malformed token returns 401."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        headers = {"Authorization": "Bearer invalid.token.value"}
        files = {"file": ("test.txt", io.BytesIO(b"Hello Lunova knowledge base"), "text/plain")}
        res = await client.post("/api/v1/knowledge/upload", files=files, headers=headers)
        assert res.status_code == 401


@pytest.mark.asyncio
async def test_knowledge_upload_member_role_returns_403():
    """Verify that non-admin (MEMBER role) is rejected with 403 Operation not permitted."""
    company_id = uuid4()
    member_user_id = uuid4()
    member_token = JWTService.create_access_token(
        subject=str(member_user_id),
        company_id=str(company_id),
        role=UserRole.MEMBER.value,
    )
    headers = {"Authorization": f"Bearer {member_token}"}

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # File upload rejected for MEMBER
        files = {"file": ("test.txt", io.BytesIO(b"Member upload attempt"), "text/plain")}
        res = await client.post("/api/v1/knowledge/upload", files=files, headers=headers)
        assert res.status_code == 403
        assert "Operation not permitted" in res.json().get("detail", "")

        # JSON ingest rejected for MEMBER
        res_json = await client.post(
            "/api/v1/knowledge/documents",
            json={"name": "test.txt", "doc_type": "txt", "content": "Member content"},
            headers=headers
        )
        assert res_json.status_code == 403
        assert "Operation not permitted" in res_json.json().get("detail", "")


@pytest.mark.asyncio
async def test_knowledge_upload_admin_success():
    """Verify that an ADMIN can successfully upload a document file (PDF/TXT)."""
    company_id = uuid4()
    admin_user_id = uuid4()
    admin_token = JWTService.create_access_token(
        subject=str(admin_user_id),
        company_id=str(company_id),
        role=UserRole.ADMIN.value,
    )
    headers = {"Authorization": f"Bearer {admin_token}"}

    mock_db = AsyncMock()
    app.dependency_overrides[get_db] = lambda: mock_db

    try:
        with patch("app.platform.services.document_service.DocumentService.ingest_document") as mock_ingest, \
             patch("app.platform.services.document_service.DocumentService.process_document_bg") as mock_bg:

            doc_id = uuid4()
            now = datetime.now(timezone.utc)
            mock_doc = KnowledgeDocument(
                id=doc_id,
                company_id=company_id,
                name="compliance_spec.txt",
                doc_type="txt",
                source="Knowledge Base Upload",
                status="PROCESSING",
                created_at=now,
                updated_at=now,
            )
            mock_ingest.return_value = mock_doc

            async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
                files = {"file": ("compliance_spec.txt", io.BytesIO(b"Enterprise SOC2 compliance protocol details"), "text/plain")}
                res = await client.post(
                    "/api/v1/knowledge/upload",
                    files=files,
                    data={"category": "Security"},
                    headers=headers
                )

                assert res.status_code == 201
                data = res.json()
                assert data["name"] == "compliance_spec.txt"
                assert data["status"] == "PROCESSING"

                # Verify DocumentService received the extracted content and company_id
                mock_ingest.assert_called_once()
                call_args = mock_ingest.call_args
                passed_db, passed_doc_create, passed_company_id = call_args[0]
                assert passed_company_id == company_id
                assert passed_doc_create.name == "compliance_spec.txt"
                assert "SOC2 compliance protocol" in passed_doc_create.content
    finally:
        app.dependency_overrides.pop(get_db, None)


@pytest.mark.asyncio
async def test_knowledge_documents_tenant_isolation():
    """Verify that GET /api/v1/knowledge/documents only returns documents belonging to the authenticated tenant."""
    company_a_id = uuid4()
    company_b_id = uuid4()

    token_a = JWTService.create_access_token(
        subject=str(uuid4()),
        company_id=str(company_a_id),
        role=UserRole.ADMIN.value,
    )

    mock_db = AsyncMock()
    app.dependency_overrides[get_db] = lambda: mock_db

    try:
        with patch("app.platform.services.document_service.DocumentService.get_documents") as mock_get_docs:
            now = datetime.now(timezone.utc)
            doc_a = KnowledgeDocument(
                id=uuid4(),
                company_id=company_a_id,
                name="Company_A_Architecture.pdf",
                doc_type="pdf",
                source="Internal",
                status="READY",
                created_at=now,
                updated_at=now,
            )
            mock_get_docs.return_value = [doc_a]

            async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
                res = await client.get("/api/v1/knowledge/documents", headers={"Authorization": f"Bearer {token_a}"})
                assert res.status_code == 200
                docs = res.json()
                assert len(docs) == 1
                assert docs[0]["name"] == "Company_A_Architecture.pdf"

                # Assert that DocumentService was called strictly with company_a_id
                mock_get_docs.assert_called_once()
                _, passed_company_id = mock_get_docs.call_args[0]
                assert passed_company_id == company_a_id
                assert passed_company_id != company_b_id
    finally:
        app.dependency_overrides.pop(get_db, None)


@pytest.mark.asyncio
async def test_knowledge_upload_xlsx_success():
    """Verify that an ADMIN can upload an XLSX file and extract its content."""
    import zipfile
    xlsx_stream = io.BytesIO()
    with zipfile.ZipFile(xlsx_stream, "w") as zf:
        zf.writestr("[Content_Types].xml", '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/></Types>')
        zf.writestr("xl/sharedStrings.xml", '<sst xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><si><t>Enterprise SLA</t></si><si><t>99.99% Guaranteed</t></si></sst>')
        zf.writestr("xl/worksheets/sheet1.xml", '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData><row r="1"><c r="A1" t="s"><v>0</v></c><c r="B1" t="s"><v>1</v></c></row></sheetData></worksheet>')

    company_id = uuid4()
    admin_token = JWTService.create_access_token(
        subject=str(uuid4()),
        company_id=str(company_id),
        role=UserRole.ADMIN.value,
    )
    headers = {"Authorization": f"Bearer {admin_token}"}

    mock_db = AsyncMock()
    app.dependency_overrides[get_db] = lambda: mock_db

    try:
        with patch("app.platform.services.document_service.DocumentService.ingest_document") as mock_ingest, \
             patch("app.platform.services.document_service.DocumentService.process_document_bg"):

            now = datetime.now(timezone.utc)
            mock_doc = KnowledgeDocument(
                id=uuid4(),
                company_id=company_id,
                name="service_levels.xlsx",
                doc_type="xlsx",
                source="Pricing",
                status="PROCESSING",
                created_at=now,
                updated_at=now,
            )
            mock_ingest.return_value = mock_doc

            async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
                files = {"file": ("service_levels.xlsx", io.BytesIO(xlsx_stream.getvalue()), "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")}
                res = await client.post(
                    "/api/v1/knowledge/upload",
                    files=files,
                    data={"category": "Pricing"},
                    headers=headers
                )
                assert res.status_code == 201
                data = res.json()
                assert data["name"] == "service_levels.xlsx"
                assert mock_ingest.called
                _, passed_create, passed_cid = mock_ingest.call_args[0]
                assert passed_cid == company_id
                assert "Enterprise SLA" in passed_create.content
    finally:
        app.dependency_overrides.pop(get_db, None)


@pytest.mark.asyncio
async def test_knowledge_delete_document_endpoints():
    """Verify document deletion RBAC, success (204), and not found (404)."""
    company_id = uuid4()
    doc_id = uuid4()

    admin_token = JWTService.create_access_token(
        subject=str(uuid4()),
        company_id=str(company_id),
        role=UserRole.ADMIN.value,
    )
    member_token = JWTService.create_access_token(
        subject=str(uuid4()),
        company_id=str(company_id),
        role=UserRole.MEMBER.value,
    )

    mock_db = AsyncMock()
    app.dependency_overrides[get_db] = lambda: mock_db

    try:
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            # 1. MEMBER is forbidden (403)
            res_member = await client.delete(
                f"/api/v1/knowledge/documents/{doc_id}",
                headers={"Authorization": f"Bearer {member_token}"}
            )
            assert res_member.status_code == 403

            # 2. ADMIN success (204)
            with patch("app.platform.services.document_service.DocumentService.delete_document", return_value=True):
                res_admin = await client.delete(
                    f"/api/v1/knowledge/documents/{doc_id}",
                    headers={"Authorization": f"Bearer {admin_token}"}
                )
                assert res_admin.status_code == 204

            # 3. ADMIN not found (404)
            with patch("app.platform.services.document_service.DocumentService.delete_document", return_value=False):
                res_404 = await client.delete(
                    f"/api/v1/knowledge/documents/{doc_id}",
                    headers={"Authorization": f"Bearer {admin_token}"}
                )
                assert res_404.status_code == 404
    finally:
        app.dependency_overrides.pop(get_db, None)

