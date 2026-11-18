import pytest
from app.platform.services.proposal_service import ProposalService
from app.core.config import settings
from intelligence.providers.mock import MockLLMProvider, MockEmbeddingProvider


def test_default_mock_provider_resolution(monkeypatch):
    """Verify default local configuration resolves to mock providers without credentials."""
    monkeypatch.setattr(settings, "ENVIRONMENT", "development")
    monkeypatch.setattr(settings, "LLM_PROVIDER", "mock")
    monkeypatch.setattr(settings, "EMBEDDING_PROVIDER", "mock")

    llm = ProposalService.get_llm_provider()
    emb = ProposalService.get_embedding_provider()

    assert isinstance(llm, MockLLMProvider)
    assert isinstance(emb, MockEmbeddingProvider)


def test_fake_alias_supported_in_development(monkeypatch):
    """Verify legacy 'fake' alias resolves cleanly to mock providers in non-production."""
    monkeypatch.setattr(settings, "ENVIRONMENT", "development")
    monkeypatch.setattr(settings, "LLM_PROVIDER", "fake")
    monkeypatch.setattr(settings, "EMBEDDING_PROVIDER", "fake")

    llm = ProposalService.get_llm_provider()
    emb = ProposalService.get_embedding_provider()

    assert isinstance(llm, MockLLMProvider)
    assert isinstance(emb, MockEmbeddingProvider)


def test_mock_and_fake_rejected_in_production(monkeypatch):
    """Verify neither mock nor fake alias can be silently used in production."""
    monkeypatch.setattr(settings, "ENVIRONMENT", "production")

    # Test mock in production
    monkeypatch.setattr(settings, "LLM_PROVIDER", "mock")
    with pytest.raises(ValueError, match="not permitted in production"):
        ProposalService.get_llm_provider()

    monkeypatch.setattr(settings, "EMBEDDING_PROVIDER", "mock")
    with pytest.raises(ValueError, match="not permitted in production"):
        ProposalService.get_embedding_provider()

    # Test fake alias in production
    monkeypatch.setattr(settings, "LLM_PROVIDER", "fake")
    with pytest.raises(ValueError, match="not permitted in production"):
        ProposalService.get_llm_provider()

    monkeypatch.setattr(settings, "EMBEDDING_PROVIDER", "fake")
    with pytest.raises(ValueError, match="not permitted in production"):
        ProposalService.get_embedding_provider()


def test_invalid_provider_name_fails_cleanly(monkeypatch):
    """Verify unknown provider strings raise a clear unsupported error."""
    monkeypatch.setattr(settings, "ENVIRONMENT", "development")

    monkeypatch.setattr(settings, "LLM_PROVIDER", "unsupported_llm")
    with pytest.raises(ValueError, match="Unsupported or missing LLM_PROVIDER: unsupported_llm"):
        ProposalService.get_llm_provider()

    monkeypatch.setattr(settings, "EMBEDDING_PROVIDER", "unknown_embeddings")
    with pytest.raises(ValueError, match="Unsupported or missing EMBEDDING_PROVIDER: unknown_embeddings"):
        ProposalService.get_embedding_provider()


def test_empty_or_none_provider_fails_cleanly(monkeypatch):
    """Verify missing/empty provider configurations raise clear errors."""
    monkeypatch.setattr(settings, "ENVIRONMENT", "development")

    monkeypatch.setattr(settings, "LLM_PROVIDER", "")
    with pytest.raises(ValueError, match="Unsupported or missing LLM_PROVIDER"):
        ProposalService.get_llm_provider()

    monkeypatch.setattr(settings, "EMBEDDING_PROVIDER", None)
    with pytest.raises(ValueError, match="Unsupported or missing EMBEDDING_PROVIDER"):
        ProposalService.get_embedding_provider()


def test_gemini_provider_selection(monkeypatch):
    """Verify Gemini selection branch routes to Gemini classes."""
    monkeypatch.setattr(settings, "ENVIRONMENT", "development")
    monkeypatch.setattr(settings, "LLM_PROVIDER", "gemini")
    monkeypatch.setattr(settings, "EMBEDDING_PROVIDER", "gemini")
    monkeypatch.setenv("GEMINI_API_KEY", "fake-test-key-for-instantiation")

    from intelligence.providers.gemini import GeminiProvider
    from intelligence.providers.gemini_embedding import GeminiEmbeddingProvider

    llm = ProposalService.get_llm_provider()
    emb = ProposalService.get_embedding_provider()

    assert isinstance(llm, GeminiProvider)
    assert isinstance(emb, GeminiEmbeddingProvider)
