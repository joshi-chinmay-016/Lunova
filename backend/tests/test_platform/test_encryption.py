import pytest
from cryptography.fernet import Fernet
from app.core.security import (
    TokenEncryptionService,
    MissingEncryptionKeyError,
    InvalidEncryptionKeyError,
    TokenEncryptionError,
    TokenDecryptionError,
)


def test_key_generation():
    """Verify that generate_key creates a valid Fernet key."""
    key = TokenEncryptionService.generate_key()
    assert isinstance(key, str)
    assert len(key) == 44  # 32 base64 urlsafe bytes = 44 chars
    # Ensure it can instantiate Fernet without error
    fernet = Fernet(key.encode())
    assert fernet is not None


def test_missing_encryption_key_raises_error(monkeypatch):
    """Verify that MissingEncryptionKeyError is raised when no key is configured."""
    monkeypatch.setattr("app.core.security.settings.GMAIL_TOKEN_ENCRYPTION_KEY", None)
    with pytest.raises(MissingEncryptionKeyError, match="GMAIL_TOKEN_ENCRYPTION_KEY is not configured"):
        TokenEncryptionService()

    with pytest.raises(MissingEncryptionKeyError):
        TokenEncryptionService("")

    with pytest.raises(MissingEncryptionKeyError):
        TokenEncryptionService("   ")


def test_invalid_encryption_key_raises_error():
    """Verify that InvalidEncryptionKeyError is raised for malformed keys."""
    with pytest.raises(InvalidEncryptionKeyError, match="GMAIL_TOKEN_ENCRYPTION_KEY is invalid"):
        TokenEncryptionService("not-a-valid-fernet-key")

    with pytest.raises(InvalidEncryptionKeyError):
        TokenEncryptionService("short_key_12345")

    with pytest.raises(InvalidEncryptionKeyError):
        # 31 bytes instead of 32
        import base64
        TokenEncryptionService(base64.urlsafe_b64encode(b"0" * 31).decode())

    with pytest.raises(InvalidEncryptionKeyError):
        # Non-string type
        TokenEncryptionService(12345)  # type: ignore


def test_encryption_decryption_roundtrip():
    """Verify full round-trip encryption and decryption of OAuth tokens."""
    key = TokenEncryptionService.generate_key()
    service = TokenEncryptionService(key)

    original_token = "ya29.a0AfH6SMD_mock_access_token_1234567890abcdef"
    encrypted = service.encrypt(original_token)

    # Ciphertext must differ from original and never contain plaintext substring
    assert encrypted != original_token
    assert original_token not in encrypted

    # Decrypted matches original
    decrypted = service.decrypt(encrypted)
    assert decrypted == original_token


def test_encryption_randomization():
    """Verify Fernet creates non-deterministic ciphertext for the same plaintext."""
    key = TokenEncryptionService.generate_key()
    service = TokenEncryptionService(key)

    plaintext = "refresh_token_secret_value_123"
    cipher_1 = service.encrypt(plaintext)
    cipher_2 = service.encrypt(plaintext)

    assert cipher_1 != cipher_2
    assert service.decrypt(cipher_1) == plaintext
    assert service.decrypt(cipher_2) == plaintext


def test_decryption_with_wrong_key_fails():
    """Verify that decrypting with a different valid key fails safely."""
    key_a = TokenEncryptionService.generate_key()
    key_b = TokenEncryptionService.generate_key()

    service_a = TokenEncryptionService(key_a)
    service_b = TokenEncryptionService(key_b)

    token = "secret_oauth_token_to_protect"
    ciphertext = service_a.encrypt(token)

    with pytest.raises(TokenDecryptionError, match="Failed to decrypt token") as exc_info:
        service_b.decrypt(ciphertext)

    # Ensure secret token does not appear in exception message
    assert token not in str(exc_info.value)


def test_decryption_of_corrupted_ciphertext_fails():
    """Verify that decrypting tampered or corrupted ciphertext raises TokenDecryptionError."""
    key = TokenEncryptionService.generate_key()
    service = TokenEncryptionService(key)

    token = "secret_oauth_token"
    ciphertext = service.encrypt(token)

    # Corrupt the ciphertext payload
    corrupted = ciphertext[:10] + "XYZ" + ciphertext[13:]

    with pytest.raises(TokenDecryptionError) as exc_info:
        service.decrypt(corrupted)

    assert token not in str(exc_info.value)


def test_invalid_input_validation():
    """Verify that empty, non-string, or whitespace-only inputs are rejected."""
    key = TokenEncryptionService.generate_key()
    service = TokenEncryptionService(key)

    with pytest.raises(ValueError, match="must be a non-empty string"):
        service.encrypt("")

    with pytest.raises(ValueError, match="must be a non-empty string"):
        service.encrypt(None)  # type: ignore

    with pytest.raises(ValueError, match="must be a non-empty string"):
        service.decrypt("")

    with pytest.raises(ValueError, match="must be a non-empty string"):
        service.decrypt("   ")

    with pytest.raises(ValueError, match="must be a non-empty string"):
        service.decrypt(12345)  # type: ignore
