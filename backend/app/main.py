from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings

from app.api.routes.proposals import router as proposals_router
from app.api.routes.knowledge import router as knowledge_router
from app.api.routes.auth import router as auth_router
from app.api.routes.intelligence import router as intelligence_router

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url="/api/v1/openapi.json"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router, prefix="/api/v1")
app.include_router(proposals_router, prefix="/api/v1")
app.include_router(knowledge_router, prefix="/api/v1")
app.include_router(intelligence_router, prefix="/api/v1")

@app.get("/health")
async def health_check():
    return {"status": "ok", "project": settings.PROJECT_NAME}

