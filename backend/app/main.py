from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings

from app.api.routes.proposals import router as proposals_router
from app.api.routes.knowledge import router as knowledge_router
from app.api.routes.auth import router as auth_router
from app.api.routes.intelligence import router as intelligence_router
from app.api.routes.integrations import router as integrations_router

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url="/api/v1/openapi.json"
)

# Comprehensive CORS Configuration for all local development origins
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:3001",
    "http://127.0.0.1:3001",
    "http://localhost:8000",
    "http://127.0.0.1:8000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1)(:\d+)?$",
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS", "HEAD"],
    allow_headers=["*"],
    expose_headers=["*"],
    max_age=86400,
)

app.include_router(auth_router, prefix="/api/v1")
app.include_router(proposals_router, prefix="/api/v1")
app.include_router(knowledge_router, prefix="/api/v1")
app.include_router(intelligence_router, prefix="/api/v1")
app.include_router(integrations_router, prefix="/api/v1")

@app.get("/health")
async def health_check():
    return {"status": "ok", "project": settings.PROJECT_NAME}
