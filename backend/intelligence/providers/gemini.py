"""Google Gemini LLM provider implementation using the official google-genai SDK.

Decoupled from extraction business logic and isolated strictly within the
provider layer. Never leaks API keys into logs, exceptions, or payloads.
"""

import os
import re
from typing import Any, Optional, Type, TypeVar

from ..config import intelligence_config
from ..exceptions import ProviderError
from ..logger import log_provider_error
from .llm import LLMProvider

T = TypeVar("T")


class GeminiProvider(LLMProvider):
    """Google Gemini LLM provider using modern google-genai SDK.

    Implements LLMProvider with structured schema-constrained generation.
    All external API failures are sanitized and wrapped in ProviderError.
    """

    def __init__(
        self,
        api_key: Optional[str] = None,
        model_name: Optional[str] = None,
        client: Optional[Any] = None,
    ) -> None:
        if api_key is not None:
            self._api_key = api_key
        else:
            self._api_key = os.getenv("GEMINI_API_KEY") or intelligence_config.gemini_api_key
        self._model_name = model_name or os.getenv("GEMINI_MODEL") or intelligence_config.gemini_model or "gemini-3.6-flash"
        self._client = client



    @property
    def provider_name(self) -> str:
        return "gemini"

    @property
    def model_name(self) -> str:
        return self._model_name

    def _get_client(self) -> Any:
        """Lazily initialize the google-genai Client."""
        if self._client is not None:
            return self._client

        if not self._api_key or not self._api_key.strip():
            raise ProviderError(
                "Gemini API key is not configured. Set the GEMINI_API_KEY environment variable "
                "or pass api_key explicitly."
            )

        try:
            from google import genai

            self._client = genai.Client(api_key=self._api_key)
            return self._client
        except Exception as exc:
            log_provider_error(self.provider_name, type(exc).__name__)
            raise ProviderError(f"Failed to initialize Gemini client: {self._sanitize_error(str(exc))}") from None

    def _sanitize_error(self, message: str) -> str:
        """Strip any accidental API key or credential string patterns from error messages."""
        if self._api_key and len(self._api_key) > 6:
            message = message.replace(self._api_key, "[REDACTED_API_KEY]")
        # Redact common API key patterns (e.g., AIzaSy...)
        message = re.sub(r"AIza[0-9A-Za-z-_]{35}", "[REDACTED_API_KEY]", message)
        return message

    def generate(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        temperature: float = 0.2,
        **kwargs: Any,
    ) -> str:
        """Generate unstructured text completion via Gemini."""
        client = self._get_client()

        try:
            from google.genai import types

            config = types.GenerateContentConfig(
                temperature=temperature,
                system_instruction=system_prompt if system_prompt else None,
            )
            response = client.models.generate_content(
                model=self._model_name,
                contents=prompt,
                config=config,
            )
            if not response or not response.text:
                raise ProviderError("Gemini returned an empty response.")
            return response.text
        except ProviderError:
            raise
        except Exception as exc:
            log_provider_error(self.provider_name, type(exc).__name__)
            raise ProviderError(f"Gemini generation failed: {self._sanitize_error(str(exc))}") from None

    def generate_structured(
        self,
        prompt: str,
        response_schema: Type[T],
        system_prompt: Optional[str] = None,
        temperature: float = 0.2,
        **kwargs: Any,
    ) -> T:
        """Generate schema-constrained structured output via Gemini."""
        client = self._get_client()

        try:
            from google.genai import types

            config = types.GenerateContentConfig(
                temperature=temperature,
                response_mime_type="application/json",
                response_schema=response_schema,
                system_instruction=system_prompt if system_prompt else None,
            )
            response = client.models.generate_content(
                model=self._model_name,
                contents=prompt,
                config=config,
            )

            # Case 1: SDK automatically parsed the response into the schema model
            if hasattr(response, "parsed") and response.parsed is not None:
                if isinstance(response.parsed, response_schema):
                    return response.parsed
                if hasattr(response_schema, "model_validate"):
                    return response_schema.model_validate(response.parsed)

            # Case 2: Parse raw JSON text with Pydantic
            if response and response.text:
                if hasattr(response_schema, "model_validate_json"):
                    return response_schema.model_validate_json(response.text)
                import json

                parsed_dict = json.loads(response.text)
                if hasattr(response_schema, "model_validate"):
                    return response_schema.model_validate(parsed_dict)
                return response_schema(**parsed_dict)

            raise ProviderError("Gemini returned an empty structured response.")
        except ProviderError:
            raise
        except Exception as exc:
            log_provider_error(self.provider_name, type(exc).__name__)
            raise ProviderError(
                f"Gemini structured generation failed: {self._sanitize_error(str(exc))}"
            ) from None
