import os
import re
from pathlib import Path
from typing import Optional
from uuid import UUID

DEFAULT_BASE_STORAGE_PATH = Path("storage/attachments")


class AttachmentStorageService:
    """Service for securely persisting and retrieving raw attachment bytes on disk.
    Enforces tenant separation by partitioning storage by company_id and proposal_id.
    """

    def __init__(self, base_path: Optional[Path] = None):
        self.base_path = base_path or DEFAULT_BASE_STORAGE_PATH

    @staticmethod
    def sanitize_filename(filename: str) -> str:
        """Sanitizes a filename to prevent path traversal attacks or invalid filesystem characters."""
        clean_name = os.path.basename(filename)
        # Strip directory traversal sequences
        clean_name = re.sub(r"[\\/:\*\?\"<>\|]", "_", clean_name)
        clean_name = clean_name.replace("..", "_")
        return clean_name or "attachment"

    def get_target_directory(self, company_id: UUID, proposal_id: Optional[UUID] = None) -> Path:
        """Returns the isolated directory path for a tenant's proposal attachments."""
        if proposal_id:
            dir_path = self.base_path / str(company_id) / str(proposal_id)
        else:
            dir_path = self.base_path / str(company_id) / "unassociated"
        dir_path.mkdir(parents=True, exist_ok=True)
        return dir_path

    def save_attachment(
        self,
        company_id: UUID,
        filename: str,
        content: bytes,
        proposal_id: Optional[UUID] = None,
    ) -> str:
        """Saves attachment bytes to disk and returns the relative storage path."""
        target_dir = self.get_target_directory(company_id, proposal_id)
        safe_name = self.sanitize_filename(filename)
        file_path = target_dir / safe_name

        # Handle duplicate filenames in same directory by appending counter
        counter = 1
        stem = file_path.stem
        suffix = file_path.suffix
        while file_path.exists():
            file_path = target_dir / f"{stem}_{counter}{suffix}"
            counter += 1

        with open(file_path, "wb") as f:
            f.write(content)

        return str(file_path.as_posix())

    def read_attachment(self, storage_path: str) -> bytes:
        """Reads raw attachment bytes from disk."""
        path = Path(storage_path)
        if not path.exists() or not path.is_file():
            raise FileNotFoundError(f"Attachment file not found at: {storage_path}")
        with open(path, "rb") as f:
            return f.read()

    def delete_attachment(self, storage_path: str) -> bool:
        """Deletes an attachment file if it exists."""
        path = Path(storage_path)
        if path.exists() and path.is_file():
            path.unlink()
            return True
        return False

