import base64
import binascii
from typing import Optional
from cryptography.fernet import Fernet, InvalidToken
from app.core.config import settings


class EncryptionConfigurationError(RuntimeError):
    """Raised when encryption key configuration is missing or invalid."""
    pass


class MissingEncryptionKeyError(EncryptionConfigurationError):
    """Raised when the encryption key is not configured."""
    pass


class InvalidEncryptionKeyError(EncryptionConfigurationError):
    """Raised when the encryption key is malformed or invalid."""
    pass


class TokenEncryptionError(RuntimeError):
    """Raised when encryption of a token fails."""
    pass


class TokenDecryptionError(RuntimeError):
    """Raised when decryption of a token fails."""
    pass


class TokenEncryptionService:
    """
    Authenticated encryption service for OAuth access and refresh tokens.
    Uses Fernet symmetric encryption (AES-128-CBC + HMAC-SHA256 authenticated encryption).
    """

    def __init__(self, key: Optional[str] = None):
        raw_key = key if key is not None else settings.GMAIL_TOKEN_ENCRYPTION_KEY
        if raw_key is None or (isinstance(raw_key, str) and not raw_key.strip()):
            raise MissingEncryptionKeyError(
                "GMAIL_TOKEN_ENCRYPTION_KEY is not configured. "
                "A secure 32-byte url-safe base64-encoded key is required."
            )

        if not isinstance(raw_key, (str, bytes)):
            raise InvalidEncryptionKeyError(
                "GMAIL_TOKEN_ENCRYPTION_KEY must be a string or bytes."
            )

        key_bytes = raw_key.strip().encode("utf-8") if isinstance(raw_key, str) else raw_key
        try:
            decoded = base64.urlsafe_b64decode(key_bytes)
            if len(decoded) != 32:
                raise ValueError("Key must decode to exactly 32 bytes.")
            self._fernet = Fernet(key_bytes)
        except (ValueError, binascii.Error, TypeError) as exc:
            raise InvalidEncryptionKeyError(
                "GMAIL_TOKEN_ENCRYPTION_KEY is invalid. "
                "It must be a 32-byte url-safe base64-encoded string."
            ) from exc

    def encrypt(self, plaintext: str) -> str:
        """
        Encrypts a plaintext string into a Fernet ciphertext token.
        Never logs or stores the plaintext.
        """
        if not isinstance(plaintext, str) or not plaintext:
            raise ValueError("Plaintext token must be a non-empty string.")

        try:
            encrypted_bytes = self._fernet.encrypt(plaintext.encode("utf-8"))
            return encrypted_bytes.decode("utf-8")
        except (TypeError, ValueError) as exc:
            raise TokenEncryptionError("Failed to encrypt token.") from exc

    def decrypt(self, ciphertext: str) -> str:
        """
        Decrypts an encrypted Fernet ciphertext token back to plaintext.
        Fails safely if ciphertext is corrupted, tampered with, or encrypted with a different key.
        Never leaks sensitive secret fragments in error messages.
        """
        if not isinstance(ciphertext, str) or not ciphertext.strip():
            raise ValueError("Ciphertext token must be a non-empty string.")

        try:
            decrypted_bytes = self._fernet.decrypt(ciphertext.strip().encode("utf-8"))
            return decrypted_bytes.decode("utf-8")
        except InvalidToken as exc:
            raise TokenDecryptionError(
                "Failed to decrypt token: authentication failed or invalid token."
            ) from exc
        except (binascii.Error, ValueError, TypeError) as exc:
            raise TokenDecryptionError(
                "Failed to decrypt token: malformed ciphertext payload."
            ) from exc

    @staticmethod
    def generate_key() -> str:
        """Generates a cryptographically secure 32-byte base64-encoded Fernet key."""
        return Fernet.generate_key().decode("utf-8")


def get_encryption_service() -> TokenEncryptionService:
    """Dependency / helper to instantiate TokenEncryptionService from application settings."""
    return TokenEncryptionService()
