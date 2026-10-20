"""Google Gemini Embedding provider implementation using the official google-genai SDK.

Supports text-embedding-004 with 768-dimensional embeddings.
Decoupled, sanitized, and isolated strictly within the provider layer.
"""

import os
import re
from typing import Any, List, Optional

from ..config import intelligence_config
from ..exceptions import ProviderError
from ..logger import log_provider_error
from .embedding import EmbeddingProvider


class GeminiEmbeddingProvider(EmbeddingProvider):
    """Google Gemini text embedding provider using modern google-genai SDK.

    Defaults to text-embedding-004 with standard 768 dimensions.
    Validates vector length and handles API failures safely.
    """

    def __init__(
        self,
        api_key: Optional[str] = None,
        model_name: Optional[str] = None,
        dimension: Optional[int] = None,
        client: Optional[Any] = None,
    ) -> None:
        if api_key is not None:
            self._api_key = api_key
        else:
            self._api_key = os.getenv("GEMINI_API_KEY") or intelligence_config.gemini_api_key

        self._model_name = (
            model_name
            or os.getenv("GEMINI_EMBEDDING_MODEL")
            or getattr(intelligence_config, "gemini_embedding_model", None)
            or "text-embedding-004"
        )
        self._dimension = dimension or intelligence_config.embedding_dimension or 768
        self._client = client

    @property
    def provider_name(self) -> str:
        return "gemini"

    @property
    def model_name(self) -> str:
        return self._model_name

    @property
    def dimension(self) -> int:
        return self._dimension

    def _get_client(self) -> Any:
        """Lazily initialize the google-genai Client."""
        if self._client is not None:
            return self._client

        if not self._api_key or not self._api_key.strip():
            raise ProviderError(
                "Gemini API key is not configured for embeddings. Set the GEMINI_API_KEY "
                "environment variable or pass api_key explicitly."
            )

        try:
            from google import genai

            self._client = genai.Client(api_key=self._api_key)
            return self._client
        except Exception as exc:
            log_provider_error(self.provider_name, type(exc).__name__)
            raise ProviderError(
                f"Failed to initialize Gemini embedding client: {self._sanitize_error(str(exc))}"
            ) from None

    def _sanitize_error(self, message: str) -> str:
        """Strip any accidental API key or credential string patterns from error messages."""
        if self._api_key and len(self._api_key) > 6:
            message = message.replace(self._api_key, "[REDACTED_API_KEY]")
        message = re.sub(r"AIza[0-9A-Za-z-_]{35}", "[REDACTED_API_KEY]", message)
        return message

    def embed_texts(self, texts: List[str], **kwargs: Any) -> List[List[float]]:
        """Compute vector embeddings for a list of document texts."""
        if not texts:
            return []

        client = self._get_client()

        try:
            from google.genai import types

            config = types.EmbedContentConfig(
                output_dimensionality=self._dimension,
            )

            # In google-genai SDK, embed_content supports contents as str or list
            response = client.models.embed_content(
                model=self._model_name,
                contents=texts,
                config=config,
            )

            results: List[List[float]] = []
            if hasattr(response, "embeddings") and response.embeddings:
                for emb in response.embeddings:
                    vals = emb.values if hasattr(emb, "values") else list(emb)
                    if len(vals) != self._dimension:
                        raise ProviderError(
                            f"Gemini returned vector of dimension {len(vals)}, expected {self._dimension}."
                        )
                    results.append(vals)
            elif hasattr(response, "embedding") and response.embedding:
                vals = (
                    response.embedding.values
                    if hasattr(response.embedding, "values")
                    else list(response.embedding)
                )
                results.append(vals)
            else:
                raise ProviderError("Gemini returned empty embedding response.")

            return results
        except ProviderError:
            raise
        except Exception as exc:
            log_provider_error(self.provider_name, type(exc).__name__)
            raise ProviderError(
                f"Gemini embedding generation failed: {self._sanitize_error(str(exc))}"
            ) from None

    def embed_query(self, text: str, **kwargs: Any) -> List[float]:
        """Compute vector embedding for a single search query."""
        if not text or not text.strip():
            # Return zero vector for empty query to avoid crash
            return [0.0] * self._dimension

        vectors = self.embed_texts([text], **kwargs)
        if not vectors:
            raise ProviderError("Failed to generate embedding for query.")
        return vectors[0]
