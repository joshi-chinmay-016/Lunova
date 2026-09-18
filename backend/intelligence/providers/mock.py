"""Mock implementations of LLM and embedding providers for testing and Phase 1 foundation."""

from typing import Any, Dict, List, Optional


from ..config import DEFAULT_EMBEDDING_DIMENSION
from .embedding import EmbeddingProvider
from .llm import LLMProvider


class MockLLMProvider(LLMProvider):
    """Deterministic mock LLM provider for local testing without external API calls."""

    def __init__(
        self,
        default_response: Optional[str] = None,
        default_structured_response: Optional[Any] = None,
        model_name: str = "mock-llm-v1",
        simulate_error: Optional[Exception] = None,
    ) -> None:
        self._default_response = default_response or "Mock generated response text."
        self._default_structured_response = default_structured_response
        self._model_name = model_name
        self.simulate_error = simulate_error
        self.call_history: List[str] = []
        self.structured_call_history: List[Dict[str, Any]] = []

    @property
    def provider_name(self) -> str:
        return "mock"

    @property
    def model_name(self) -> str:
        return self._model_name

    def generate(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        temperature: float = 0.2,
        **kwargs: Any,
    ) -> str:
        if self.simulate_error:
            raise self.simulate_error
        self.call_history.append(prompt)
        return self._default_response

    def generate_structured(
        self,
        prompt: str,
        response_schema: type,
        system_prompt: Optional[str] = None,
        temperature: float = 0.2,
        **kwargs: Any,
    ) -> Any:
        self.call_history.append(prompt)
        self.structured_call_history.append(
            {
                "prompt": prompt,
                "response_schema": response_schema,
                "system_prompt": system_prompt,
                "temperature": temperature,
            }
        )
        if self.simulate_error:
            raise self.simulate_error

        if self._default_structured_response is not None:
            if isinstance(self._default_structured_response, dict):
                return response_schema.model_validate(self._default_structured_response)
            return self._default_structured_response

        # Default fallback for ProposalExtractionPayload or any Pydantic model
        if hasattr(response_schema, "model_validate"):
            dummy_data: Dict[str, Any] = {
                "requirements": [
                    {
                        "text": "The platform must provide normalized REST APIs with OAuth2 authentication.",
                        "category": "technical_requirement",
                        "priority": "high",
                        "explicit": True,
                        "evidence": "Must provide normalized REST APIs with OAuth2 authentication.",
                        "confidence": 0.98,
                    }
                ],
                "missing_information": [
                    {
                        "field": "submission_deadline",
                        "reason": "No submission deadline was provided in the proposal.",
                        "importance": "high",
                    }
                ],
                "ambiguities": [
                    {
                        "text": "The system must be deployed quickly.",
                        "reason": "Deployment timeframe 'quickly' lacks a concrete schedule or SLA.",
                    }
                ],
                "summary": "Mock extracted proposal requirements and specifications.",
            }
            try:
                return response_schema.model_validate(dummy_data)
            except Exception:
                # If schema fields differ, try creating with empty fields
                return response_schema()

        return response_schema()



class MockEmbeddingProvider(EmbeddingProvider):
    """Deterministic mock embedding provider returning fixed-dimension vector floats.

    Defaults to configured DEFAULT_EMBEDDING_DIMENSION (3072).
    """

    def __init__(self, dimension: Optional[int] = None) -> None:
        self._dimension = dimension if dimension is not None else DEFAULT_EMBEDDING_DIMENSION
        self.call_history: List[str] = []

    @property
    def provider_name(self) -> str:
        return "mock"

    @property
    def dimension(self) -> int:
        return self._dimension

    def _generate_vector(self, text: str) -> List[float]:
        # Generate deterministic float vector based on length and char codes
        base = float(len(text) % 100) / 100.0
        return [base] * self._dimension

    def embed_texts(self, texts: List[str], **kwargs: Any) -> List[List[float]]:
        for text in texts:
            self.call_history.append(text)
        return [self._generate_vector(t) for t in texts]

    def embed_query(self, text: str, **kwargs: Any) -> List[float]:
        self.call_history.append(text)
        return self._generate_vector(text)
