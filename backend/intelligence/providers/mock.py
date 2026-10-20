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
        if getattr(response_schema, "__name__", "") == "ProposalExtractionPayload":
            import re

            extracted_reqs: List[Dict[str, Any]] = []
            prompt_lines = [line.strip() for line in prompt.split("\n") if line.strip()]

            in_body_or_attachments = False
            for line in prompt_lines:
                if line.startswith("PROPOSAL BODY:") or line.startswith("ATTACHMENT CONTENTS:"):
                    in_body_or_attachments = True
                    continue

                if not in_body_or_attachments:
                    continue

                # Skip header/format lines
                if (
                    line.startswith("#")
                    or line.startswith("---")
                    or line.startswith("Analyze the")
                    or line.startswith("Please analyze")
                    or line.startswith("##")
                    or line.startswith("Return only")
                    or line.startswith("PROPOSAL SUBJECT:")
                ):
                    continue

                lower_line = line.lower()
                # Check for requirement keywords
                if any(
                    k in lower_line
                    for k in [
                        "must",
                        "require",
                        "need",
                        "should",
                        "support",
                        "aes",
                        "encryption",
                        "oauth",
                        "api",
                        "sla",
                        "pricing",
                        "pgvector",
                        "partition",
                        "pdf",
                        "docx",
                        "acoustic",
                        "hydrophone",
                        "transducer",
                        "firmware",
                    ]
                ):
                    clean_line = re.sub(r"^[-*•\d\.\)\s]+", "", line).strip()
                    if clean_line.startswith("(") and clean_line.endswith(")"):
                        clean_line = clean_line[1:-1].strip()
                    if clean_line.startswith("RFP Attachment:"):
                        clean_line = clean_line.replace("RFP Attachment:", "").strip()

                    if len(clean_line) > 10 and not clean_line.startswith("Analyze"):
                        cat = "technical_requirement"
                        if any(w in lower_line for w in ["price", "cost", "budget", "$", "fee", "rate"]):
                            cat = "budget"
                        elif any(w in lower_line for w in ["security", "encryption", "aes", "oauth", "sso"]):
                            cat = "security"
                        elif any(w in lower_line for w in ["deliver", "timeline", "deadline", "schedule", "week", "month"]):
                            cat = "timeline"

                        extracted_reqs.append(
                            {
                                "text": clean_line,
                                "category": cat,
                                "priority": "high",
                                "explicit": True,
                                "evidence": clean_line[:120],
                                "confidence": 0.95,
                            }
                        )

            if not extracted_reqs:
                extracted_reqs = [
                    {
                        "text": "The platform must provide normalized REST APIs with OAuth2 authentication.",
                        "category": "technical_requirement",
                        "priority": "high",
                        "explicit": True,
                        "evidence": "Must provide normalized REST APIs with OAuth2 authentication.",
                        "confidence": 0.98,
                    }
                ]

            missing_info = [
                {
                    "field": "submission_deadline",
                    "reason": "No submission deadline was provided in the proposal.",
                    "importance": "high",
                }
            ]
            ambiguities = [
                {
                    "text": "The system must be deployed quickly.",
                    "reason": "Deployment timeframe 'quickly' lacks a concrete schedule or SLA.",
                }
            ]

            payload_data = {
                "requirements": extracted_reqs,
                "missing_information": missing_info,
                "ambiguities": ambiguities,
                "summary": "Mock extracted proposal requirements and specifications.",
            }
            try:
                return response_schema.model_validate(payload_data)
            except Exception:
                pass

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
        import math
        import re
        import zlib

        vec = [0.0] * self._dimension
        words = re.findall(r"\w+", text.lower())
        if not words:
            return vec

        for word in words:
            # Deterministic hash of word into vector dimension space
            h = zlib.crc32(word.encode("utf-8")) % self._dimension
            vec[h] += 1.0

        # L2-normalize
        norm = math.sqrt(sum(v * v for v in vec))
        if norm > 0.0:
            vec = [v / norm for v in vec]
        return vec

    def embed_texts(self, texts: List[str], **kwargs: Any) -> List[List[float]]:
        for text in texts:
            self.call_history.append(text)
        return [self._generate_vector(t) for t in texts]

    def embed_query(self, text: str, **kwargs: Any) -> List[float]:
        self.call_history.append(text)
        return self._generate_vector(text)
