import os
from pathlib import Path
import pytest
from app.core.config import Settings, settings, REPO_ROOT, ROOT_ENV_FILE


def test_root_env_path_resolution():
    """Verify ROOT_ENV_FILE resolves to the repository root .env file."""
    assert ROOT_ENV_FILE == REPO_ROOT / ".env"
    assert ROOT_ENV_FILE.exists(), "Root .env must exist as the single source of truth"


def test_root_env_loads_platform_and_ai_keys():
    """Verify settings loaded from root .env contains essential platform and integration settings."""
    assert settings.PROJECT_NAME == "Lunova API"
    assert settings.FRONTEND_URL == "http://localhost:3000"
    assert settings.JWT_ALGORITHM == "HS256"
    assert settings.EMBEDDING_DIMENSION == 768


def test_settings_load_consistently_regardless_of_cwd(monkeypatch):
    """Verify settings reliably load from root .env even if cwd is changed to backend/."""
    original_cwd = os.getcwd()
    backend_dir = REPO_ROOT / "backend"
    try:
        os.chdir(backend_dir)
        new_settings = Settings()
        assert new_settings.PROJECT_NAME == "Lunova API"
        assert new_settings.FRONTEND_URL == "http://localhost:3000"
    finally:
        os.chdir(original_cwd)


def test_test_environment_override_via_monkeypatch(monkeypatch):
    """Verify tests can cleanly override environment variables via monkeypatch."""
    monkeypatch.setenv("PROJECT_NAME", "Test Overridden API")
    monkeypatch.setenv("ENVIRONMENT", "testing")
    test_settings = Settings()
    assert test_settings.PROJECT_NAME == "Test Overridden API"
    assert test_settings.ENVIRONMENT == "testing"


def test_test_isolation_via_env_file_none(monkeypatch):
    """Verify Settings(_env_file=None) can be instantiated without reading any .env file."""
    for key in ["GMAIL_CLIENT_ID", "GOOGLE_CLIENT_ID", "GMAIL_CLIENT_SECRET", "GOOGLE_CLIENT_SECRET"]:
        monkeypatch.delenv(key, raising=False)

    isolated_settings = Settings(_env_file=None)
    assert isolated_settings.GMAIL_CLIENT_ID is None
    assert isolated_settings.GOOGLE_CLIENT_ID is None


def test_google_and_gmail_alias_reconciliation(monkeypatch):
    """Verify that GOOGLE_* aliases map properly to GMAIL_* configuration."""
    for key in ["GMAIL_CLIENT_ID", "GOOGLE_CLIENT_ID", "GMAIL_CLIENT_SECRET", "GOOGLE_CLIENT_SECRET", "GMAIL_TOKEN_ENCRYPTION_KEY", "ENCRYPTION_KEY"]:
        monkeypatch.delenv(key, raising=False)

    alias_settings = Settings(
        GOOGLE_CLIENT_ID="alias-client-id.apps.googleusercontent.com",
        GOOGLE_CLIENT_SECRET="alias-client-secret-123",
        ENCRYPTION_KEY="alias-encryption-key-xyz",
        _env_file=None,
    )

    assert alias_settings.GMAIL_CLIENT_ID == "alias-client-id.apps.googleusercontent.com"
    assert alias_settings.google_client_id == "alias-client-id.apps.googleusercontent.com"
    assert alias_settings.GMAIL_CLIENT_SECRET == "alias-client-secret-123"
    assert alias_settings.google_client_secret == "alias-client-secret-123"
    assert alias_settings.GMAIL_TOKEN_ENCRYPTION_KEY == "alias-encryption-key-xyz"


def test_backend_dotenv_absence():
    """Verify backend/.env does not exist and is not needed."""
    backend_env = REPO_ROOT / "backend" / ".env"
    assert not backend_env.exists(), "backend/.env should be removed to prevent configuration drift"
