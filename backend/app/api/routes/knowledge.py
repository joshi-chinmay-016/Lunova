from typing import List
from uuid import UUID
from fastapi import APIRouter, Depends, BackgroundTasks, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.api.dependencies.auth import get_current_active_user, RoleChecker
from app.auth.schemas import AuthenticatedUser
from app.models.user import UserRole
from app.platform.schemas.document import DocumentCreate, DocumentResponse
from app.platform.services.document_service import DocumentService

router = APIRouter(prefix="/knowledge", tags=["Knowledge"])

@router.post("/documents", response_model=DocumentResponse, status_code=status.HTTP_201_CREATED)
async def ingest_document(
    data: DocumentCreate,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    current_user: AuthenticatedUser = Depends(RoleChecker([UserRole.ADMIN]))
):
    doc = await DocumentService.ingest_document(db, data, current_user.company_id)
    
    # Process the document directly in background
    background_tasks.add_task(DocumentService.process_document_bg, doc.id, current_user.company_id, data.content)
    
    return doc


@router.get("/documents", response_model=List[DocumentResponse])
async def list_documents(
    db: AsyncSession = Depends(get_db),
    current_user: AuthenticatedUser = Depends(get_current_active_user)
):
    return await DocumentService.get_documents(db, current_user.company_id)
