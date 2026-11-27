from typing import List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, BackgroundTasks, status, UploadFile, File, Form, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.api.dependencies.auth import get_current_active_user, RoleChecker
from app.auth.schemas import AuthenticatedUser
from app.models.user import UserRole
from app.platform.schemas.document import DocumentCreate, DocumentResponse
from app.platform.services.document_service import DocumentService
from intelligence.document_processing.parser import AttachmentParser

router = APIRouter(prefix="/knowledge", tags=["Knowledge"])


@router.post("/upload", response_model=DocumentResponse, status_code=status.HTTP_201_CREATED)
async def upload_document_file(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    category: Optional[str] = Form(None),
    db: AsyncSession = Depends(get_db),
    current_user: AuthenticatedUser = Depends(RoleChecker([UserRole.ADMIN]))
):
    """
    Upload and parse raw document files (PDF, DOCX, TXT) into the company's knowledge base.
    Extracts text using AttachmentParser, runs quarantine checks, chunks, embeds, and stores.
    Protected by RBAC: only company ADMIN can upload documents.
    """
    if not file.filename:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="File must have a valid filename.")

    file_bytes = await file.read()
    if not file_bytes:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Uploaded file is empty.")

    parser = AttachmentParser()
    parsed = parser.parse(
        content=file_bytes,
        filename=file.filename,
        content_type=file.content_type
    )

    if not parsed.is_usable:
        error_detail = parsed.error_message or "Unable to extract readable text from document."
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=error_detail)

    ext = file.filename.rsplit(".", 1)[-1].lower() if "." in file.filename else "pdf"
    doc_create = DocumentCreate(
        name=file.filename,
        doc_type=ext,
        source=category or "Knowledge Base Upload",
        content=parsed.text
    )

    try:
        doc = await DocumentService.ingest_document(db, doc_create, current_user.company_id)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

    background_tasks.add_task(
        DocumentService.process_document_bg,
        doc.id,
        current_user.company_id,
        parsed.text
    )

    return doc


@router.post("/documents", response_model=DocumentResponse, status_code=status.HTTP_201_CREATED)
async def ingest_document(
    data: DocumentCreate,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    current_user: AuthenticatedUser = Depends(RoleChecker([UserRole.ADMIN]))
):
    try:
        doc = await DocumentService.ingest_document(db, data, current_user.company_id)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    
    # Process the document directly in background
    background_tasks.add_task(DocumentService.process_document_bg, doc.id, current_user.company_id, data.content)
    
    return doc


@router.get("/documents", response_model=List[DocumentResponse])
async def list_documents(
    db: AsyncSession = Depends(get_db),
    current_user: AuthenticatedUser = Depends(get_current_active_user)
):
    return await DocumentService.get_documents(db, current_user.company_id)


@router.delete("/documents/{document_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_document(
    document_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: AuthenticatedUser = Depends(RoleChecker([UserRole.ADMIN]))
):
    success = await DocumentService.delete_document(db, document_id, current_user.company_id)
    if not success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")
