from typing import Optional, List
from pathlib import Path
from pydantic import model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

# Determine repository root directory (3 levels above backend/app/core/config.py)
REPO_ROOT = Path(__file__).resolve().parents[3]
ROOT_ENV_FILE = REPO_ROOT / ".env"

class Settings(BaseSettings):
    PROJECT_NAME: str = "Lunova API"
    ENVIRONMENT: str = "development"
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/lunova"
    FRONTEND_URL: str = "http://localhost:3000"
    
    # Auth Settings
    JWT_SECRET_KEY: str = "supersecretkey_for_development_only"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    # AI Settings
    LLM_PROVIDER: str = "mock" # or "gemini"
    LLM_MODEL: str = "default-model"
    EMBEDDING_PROVIDER: str = "mock" # or "gemini"
    EMBEDDING_MODEL: str = "text-embedding-004"
    EMBEDDING_DIMENSION: int = 768 # Explicit dimension configuration aligned with Gemini
    CHUNK_SIZE: int = 1000
    CHUNK_OVERLAP: int = 200
    RETRIEVAL_TOP_K: int = 5
    GEMINI_API_KEY: Optional[str] = None
    GEMINI_MODEL: str = "gemini-3.6-flash"
    MAX_PROPOSAL_INPUT_CHARS: int = 50000
    RUN_LIVE_LLM_TESTS: int = 0

    # Gmail / Google OAuth & Encryption Settings
    GMAIL_CLIENT_ID: Optional[str] = None
    GOOGLE_CLIENT_ID: Optional[str] = None
    GMAIL_CLIENT_SECRET: Optional[str] = None
    GOOGLE_CLIENT_SECRET: Optional[str] = None
    GMAIL_REDIRECT_URI: str = "http://localhost:8000/api/v1/integrations/gmail/callback"
    GOOGLE_REDIRECT_URI: Optional[str] = None
    GOOGLE_OAUTH_SCOPES: Optional[str] = None
    GMAIL_TOKEN_ENCRYPTION_KEY: Optional[str] = None
    ENCRYPTION_KEY: Optional[str] = None

    # Secure Local Development Bootstrap Settings
    DEV_BOOTSTRAP_ENABLED: bool = True
    DEV_BOOTSTRAP_SECRET: Optional[str] = None
    INITIAL_ADMIN_EMAIL: str = "admin@lunetron.com"
    INITIAL_ADMIN_PASSWORD: Optional[str] = None

    @model_validator(mode="before")
    @classmethod
    def reconcile_google_aliases(cls, data: dict) -> dict:
        if isinstance(data, dict):
            google_id = data.get("GOOGLE_CLIENT_ID")
            gmail_id = data.get("GMAIL_CLIENT_ID")
            if google_id and (not gmail_id or "your-google-oauth" in str(gmail_id)):
                data["GMAIL_CLIENT_ID"] = google_id
            elif gmail_id and not google_id:
                data["GOOGLE_CLIENT_ID"] = gmail_id

            google_secret = data.get("GOOGLE_CLIENT_SECRET")
            gmail_secret = data.get("GMAIL_CLIENT_SECRET")
            if google_secret and (not gmail_secret or "your-google-oauth" in str(gmail_secret)):
                data["GMAIL_CLIENT_SECRET"] = google_secret
            elif gmail_secret and not google_secret:
                data["GOOGLE_CLIENT_SECRET"] = gmail_secret

            google_uri = data.get("GOOGLE_REDIRECT_URI")
            gmail_uri = data.get("GMAIL_REDIRECT_URI")
            if google_uri and (not gmail_uri or gmail_uri == "http://localhost:8000/api/v1/integrations/gmail/callback"):
                data["GMAIL_REDIRECT_URI"] = google_uri
            elif gmail_uri and not google_uri:
                data["GOOGLE_REDIRECT_URI"] = gmail_uri

            enc_key = data.get("ENCRYPTION_KEY")
            gmail_enc = data.get("GMAIL_TOKEN_ENCRYPTION_KEY")
            if enc_key and (not gmail_enc or "your-32-byte" in str(gmail_enc)):
                data["GMAIL_TOKEN_ENCRYPTION_KEY"] = enc_key
            elif gmail_enc and not enc_key:
                data["ENCRYPTION_KEY"] = gmail_enc

        return data

    @property
    def google_client_id(self) -> Optional[str]:
        return self.GMAIL_CLIENT_ID or self.GOOGLE_CLIENT_ID

    @property
    def google_client_secret(self) -> Optional[str]:
        return self.GMAIL_CLIENT_SECRET or self.GOOGLE_CLIENT_SECRET

    @property
    def google_redirect_uri(self) -> str:
        return self.GMAIL_REDIRECT_URI or self.GOOGLE_REDIRECT_URI or "http://localhost:8000/api/v1/integrations/gmail/callback"

    @property
    def oauth_scopes(self) -> List[str]:
        if self.GOOGLE_OAUTH_SCOPES:
            parsed = [s.strip() for s in self.GOOGLE_OAUTH_SCOPES.replace(",", " ").split() if s.strip()]
            if parsed:
                return parsed
        return [
            "https://www.googleapis.com/auth/gmail.readonly",
            "https://www.googleapis.com/auth/gmail.send",
            "https://www.googleapis.com/auth/userinfo.email",
        ]

    model_config = SettingsConfigDict(
        env_file=ROOT_ENV_FILE if ROOT_ENV_FILE.exists() else ".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"
    )

settings = Settings()
