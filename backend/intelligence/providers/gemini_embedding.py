import os
from typing import Any, List, Optional
from google import genai
from .embedding import EmbeddingProvider
from ..exceptions import ProviderError
from ..logger import log_provider_error
from ..config import intelligence_config

class GeminiEmbeddingProvider(EmbeddingProvider):
    def __init__(self, api_key: Optional[str] = None, model_name: str = "gemini-embedding-001", client: Optional[Any] = None) -> None:
        self._api_key = api_key or os.getenv("GEMINI_API_KEY") or intelligence_config.gemini_api_key
        self._model_name = model_name
        self._client = client

    @property
    def provider_name(self) -> str:
        return "gemini-embedding"

    @property
    def dimension(self) -> int:
        return 1536

    def _get_client(self) -> Any:
        if self._client is not None:
            return self._client
        if not self._api_key or not self._api_key.strip():
            raise ProviderError("Gemini API key is not configured.")
        try:
            self._client = genai.Client(api_key=self._api_key)
            return self._client
        except Exception as exc:
            raise ProviderError(f"Failed to initialize Gemini client: {exc}")

    def embed_texts(self, texts: List[str], **kwargs: Any) -> List[List[float]]:
        client = self._get_client()
        try:
            from google.genai import types
            response = client.models.embed_content(
                model=self._model_name,
                contents=texts,
                config=types.EmbedContentConfig(task_type="RETRIEVAL_DOCUMENT", output_dimensionality=1536)
            )
            return [emb.values for emb in response.embeddings]
        except Exception as exc:
            raise ProviderError(f"Gemini embedding failed: {exc}")

    def embed_query(self, text: str, **kwargs: Any) -> List[float]:
        client = self._get_client()
        try:
            from google.genai import types
            response = client.models.embed_content(
                model=self._model_name,
                contents=text,
                config=types.EmbedContentConfig(task_type="RETRIEVAL_QUERY", output_dimensionality=1536)
            )
            if isinstance(response.embeddings, list):
                return response.embeddings[0].values
            return response.embeddings.values
        except Exception as exc:
            raise ProviderError(f"Gemini embedding failed: {exc}")
