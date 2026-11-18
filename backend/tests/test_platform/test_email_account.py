import uuid
from datetime import datetime, timezone
import pytest
from sqlalchemy import inspect
import importlib.util
from pathlib import Path
from app.models.base import Base
from app.models.company import Company
from app.models.email import Email
from app.models.email_account import EmailAccount, EmailProvider

# Robust path-based import allowing execution from both repo root and backend directory
_migration_file = Path(__file__).resolve().parents[2] / "migrations" / "versions" / "005_add_email_accounts.py"
_spec = importlib.util.spec_from_file_location("migration_005", _migration_file)
if _spec is None or _spec.loader is None:
    raise ImportError(f"Could not load migration module from {_migration_file}")
migration_005 = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(migration_005)



def test_email_account_model_instantiation():
    """Verify EmailAccount model fields, defaults, and attributes."""
    company_id = uuid.uuid4()
    account = EmailAccount(
        company_id=company_id,
        email_address="proposals@lunetron.com",
        encrypted_access_token="encrypted_token_blob_123",
        encrypted_refresh_token="encrypted_refresh_blob_456",
        provider=EmailProvider.GMAIL.value,
        token_expiry=datetime.now(timezone.utc),
    )

    assert account.company_id == company_id
    assert account.email_address == "proposals@lunetron.com"
    assert account.provider == "GMAIL"
    assert account.encrypted_access_token == "encrypted_token_blob_123"
    assert account.encrypted_refresh_token == "encrypted_refresh_blob_456"
    assert account.is_active is True
    assert account.history_id is None
    assert account.last_synced_at is None
    assert isinstance(account.id, uuid.UUID)


def test_email_account_table_definition():
    """Verify that email_accounts table structure adheres to multi-tenant security requirements."""
    table = Base.metadata.tables["email_accounts"]

    # Verify column existence and nullability
    assert table.c.id.primary_key is True
    assert table.c.company_id.nullable is False
    assert table.c.email_address.nullable is False
    assert table.c.provider.nullable is False
    assert table.c.encrypted_access_token.nullable is False
    assert table.c.encrypted_refresh_token.nullable is True
    assert table.c.token_expiry.nullable is True
    assert table.c.history_id.nullable is True
    assert table.c.last_synced_at.nullable is True
    assert table.c.is_active.nullable is False

    # Verify foreign key to companies.id with ondelete CASCADE
    fks = list(table.foreign_keys)
    assert len(fks) == 1
    fk = fks[0]
    assert fk.column.table.name == "companies"
    assert fk.column.name == "id"
    assert fk.ondelete.upper() == "CASCADE"

    # Verify UniqueConstraint on (company_id, provider, email_address)
    unique_constraints = [
        c for c in table.constraints if c.__class__.__name__ == "UniqueConstraint"
    ]
    uq_names = [c.name for c in unique_constraints]
    assert "uq_email_accounts_company_provider_email" in uq_names

    uq = next(
        c for c in unique_constraints if c.name == "uq_email_accounts_company_provider_email"
    )
    col_names = [col.name for col in uq.columns]
    assert col_names == ["company_id", "provider", "email_address"]


def test_email_thread_id_field_added():
    """Verify thread_id is added as a nullable, indexed column on emails table."""
    table = Base.metadata.tables["emails"]
    assert "thread_id" in table.c
    assert table.c.thread_id.nullable is True

    # Check that thread_id is an indexed column
    indexed_columns = []
    for idx in table.indexes:
        indexed_columns.extend([col.name for col in idx.columns])
    assert "thread_id" in indexed_columns


def test_company_email_accounts_relationship():
    """Verify Company model has back_populates relationship to EmailAccount."""
    company = Company(name="Lunetron")
    assert hasattr(company, "email_accounts")
    account = EmailAccount(
        company=company,
        email_address="proposals@lunetron.com",
        encrypted_access_token="enc_token",
    )
    assert account in company.email_accounts


def test_migration_005_metadata():
    """Verify migration 005 revision chain and down_revision."""
    assert migration_005.revision == "005_add_email_accounts"
    assert migration_005.down_revision == "004_align_vector_dimension_768"
    assert hasattr(migration_005, "upgrade")
    assert hasattr(migration_005, "downgrade")
