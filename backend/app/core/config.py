from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "Lunova API"
    VERSION: str = "0.1.0"
    API_V1_STR: str = "/api/v1"

    # Default MVP Tenant
    DEFAULT_COMPANY_ID: str = "lunetron"
    DEFAULT_COMPANY_NAME: str = "Lunetron"

    # Database Configuration (PostgreSQL + pgvector)
    POSTGRES_SERVER: str = "localhost"
    POSTGRES_PORT: int = 5432
    POSTGRES_USER: str = "lunova"
    POSTGRES_PASSWORD: str = "lunovapassword"
    POSTGRES_DB: str = "lunovadb"

    @property
    def DATABASE_URL(self) -> str:
        return (
            f"postgresql+asyncpg://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@"
            f"{self.POSTGRES_SERVER}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"
        )

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")


settings = Settings()
