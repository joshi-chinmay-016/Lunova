from typing import Optional
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    PROJECT_NAME: str = "Lunova API"
    ENVIRONMENT: str = "development"
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/lunova"
    
    # Auth Settings
    JWT_SECRET_KEY: str = "supersecretkey_for_development_only"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    # AI Settings
    LLM_PROVIDER: str = "fake" # or "gemini", "openai"
    LLM_MODEL: str = "default-model"
    EMBEDDING_PROVIDER: str = "fake"
    EMBEDDING_MODEL: str = "text-embedding-004"
    EMBEDDING_DIMENSION: int = 768 # Explicit dimension configuration aligned with Gemini
    CHUNK_SIZE: int = 1000
    CHUNK_OVERLAP: int = 200
    RETRIEVAL_TOP_K: int = 5

    # Gmail OAuth & Encryption Settings
    GMAIL_CLIENT_ID: Optional[str] = None
    GMAIL_CLIENT_SECRET: Optional[str] = None
    GMAIL_REDIRECT_URI: str = "http://localhost:8000/api/v1/integrations/gmail/callback"
    GMAIL_TOKEN_ENCRYPTION_KEY: Optional[str] = None

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"
    )

settings = Settings()
