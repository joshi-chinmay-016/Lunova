import os
from pathlib import Path
from uuid import uuid4
import pytest
from app.platform.services.attachment_storage import AttachmentStorageService


def test_sanitize_filename():
    assert AttachmentStorageService.sanitize_filename("valid_doc.pdf") == "valid_doc.pdf"
    assert AttachmentStorageService.sanitize_filename("../../../etc/passwd") == "passwd"
    assert AttachmentStorageService.sanitize_filename("..\\..\\secret.docx") == "secret.docx"
    assert AttachmentStorageService.sanitize_filename("weird:*?\"<>|chars.txt") == "weird_______chars.txt"
    assert AttachmentStorageService.sanitize_filename("") == "attachment"


def test_save_and_read_attachment(tmp_path):
    storage = AttachmentStorageService(base_path=tmp_path)
    company_id = uuid4()
    proposal_id = uuid4()
    content = b"Binary attachment test content"

    path = storage.save_attachment(
        company_id=company_id,
        filename="rfp_specs.pdf",
        content=content,
        proposal_id=proposal_id,
    )

    assert Path(path).exists()
    assert str(company_id) in path
    assert str(proposal_id) in path

    read_back = storage.read_attachment(path)
    assert read_back == content


def test_tenant_directory_isolation(tmp_path):
    storage = AttachmentStorageService(base_path=tmp_path)
    company_a = uuid4()
    company_b = uuid4()

    path_a = storage.save_attachment(company_a, "doc.txt", b"Tenant A")
    path_b = storage.save_attachment(company_b, "doc.txt", b"Tenant B")

    assert str(company_a) in path_a
    assert str(company_b) in path_b
    assert path_a != path_b

    assert storage.read_attachment(path_a) == b"Tenant A"
    assert storage.read_attachment(path_b) == b"Tenant B"


def test_duplicate_filename_handling(tmp_path):
    storage = AttachmentStorageService(base_path=tmp_path)
    company_id = uuid4()
    proposal_id = uuid4()

    path1 = storage.save_attachment(company_id, "doc.pdf", b"Version 1", proposal_id)
    path2 = storage.save_attachment(company_id, "doc.pdf", b"Version 2", proposal_id)

    assert path1 != path2
    assert "doc_1.pdf" in path2
    assert storage.read_attachment(path1) == b"Version 1"
    assert storage.read_attachment(path2) == b"Version 2"


def test_delete_attachment(tmp_path):
    storage = AttachmentStorageService(base_path=tmp_path)
    company_id = uuid4()

    path = storage.save_attachment(company_id, "temp.txt", b"To be deleted")
    assert Path(path).exists()

    deleted = storage.delete_attachment(path)
    assert deleted is True
    assert not Path(path).exists()

    # Deleting non-existent file returns False
    assert storage.delete_attachment(path) is False
