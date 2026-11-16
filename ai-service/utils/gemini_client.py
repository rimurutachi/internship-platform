"""
Gemini Client Manager with Dynamic Model Fallback and Rate Limit Resilience
Version: 1.0.0

Provides:
- Automatic model failover when encountering 429 RESOURCE_EXHAUSTED / Quota limits
- Seamless fallback chain across Gemini Flash Lite and Flash models
- Multiple API key support (comma-separated rotation)
- Detailed attempt logging and model attribution
"""

import os
import logging
from typing import List, Optional, Tuple, Any, Dict

logger = logging.getLogger(__name__)

# Check for google-generativeai availability
try:
    import google.generativeai as genai
    GEMINI_AVAILABLE = True
except ImportError:
    genai = None
    GEMINI_AVAILABLE = False
    logger.warning("⚠️ google-generativeai package not installed.")


class GeminiClientManager:
    """
    Manages Gemini API calls with automatic multi-model fallback.
    
    If the primary model hits a daily quota or rate limit (HTTP 429 / RESOURCE_EXHAUSTED),
    it automatically attempts the next model in the fallback chain until successful
    or all candidates are exhausted.
    """

    # Default fallback chain ordered by quota limit and speed
    DEFAULT_FALLBACKS = [
        "gemini-3.1-flash-lite",
        "gemini-3.8-flash",
        "gemini-3.5-flash",
        "gemini-3-flash",
        "gemini-2.5-flash",
        "gemini-2.5-flash-lite"
    ]

    def __init__(self):
        self._current_api_key: Optional[str] = None
        self._is_configured: bool = False

    def get_api_keys(self) -> List[str]:
        """
        Get list of API keys. Supports comma-separated GEMINI_API_KEYS
        or single GEMINI_API_KEY.
        """
        raw_keys = os.getenv("GEMINI_API_KEYS", "").strip()
        if raw_keys:
            keys = [k.strip() for k in raw_keys.split(",") if k.strip()]
            if keys:
                return keys

        single_key = os.getenv("GEMINI_API_KEY", "").strip()
        return [single_key] if single_key else []

    def get_primary_model(self) -> str:
        """Get the configured primary model (default: gemini-3.5-flash-lite)"""
        return os.getenv("GEMINI_MODEL", "gemini-3.5-flash-lite").strip()

    def get_model_candidates(self, preferred_model: Optional[str] = None) -> List[str]:
        """
        Build an ordered list of model candidates to try.
        Priority:
        1. preferred_model (if passed)
        2. GEMINI_MODEL (from environment)
        3. GEMINI_FALLBACK_MODELS (from environment or defaults)
        """
        primary = preferred_model.strip() if preferred_model else self.get_primary_model()

        raw_fallbacks = os.getenv(
            "GEMINI_FALLBACK_MODELS",
            ",".join(self.DEFAULT_FALLBACKS)
        )
        fallbacks = [m.strip() for m in raw_fallbacks.split(",") if m.strip()]

        candidates = [primary]
        for m in fallbacks:
            if m and m not in candidates:
                candidates.append(m)

        return candidates

    def is_available(self) -> bool:
        """Check if Gemini service is usable (library installed + at least one API key present)"""
        return GEMINI_AVAILABLE and len(self.get_api_keys()) > 0

    def _configure_key(self, api_key: str):
        """Configure genai with an API key if not already configured with it"""
        if not GEMINI_AVAILABLE or not api_key:
            return
        if self._current_api_key != api_key:
            genai.configure(api_key=api_key)
            self._current_api_key = api_key
            self._is_configured = True

    def _is_quota_or_transient_error(self, exc: Exception) -> bool:
        """
        Determine if an exception is caused by quota/rate-limiting or transient server issues
        warranting an immediate fallback to another model.
        """
        msg = str(exc).lower()
        quota_keywords = [
            "429",
            "resource_exhausted",
            "quota exceeded",
            "rate limit",
            "requests per day",
            "quota_metric",
            "503",
            "unavailable",
            "high demand"
        ]
        return any(kw in msg for kw in quota_keywords)

    def generate_content(
        self,
        contents: Any,
        generation_config: Optional[Dict[str, Any]] = None,
        preferred_model: Optional[str] = None
    ) -> Tuple[Any, str]:
        """
        Execute generate_content across model candidates with automatic fallback.

        Args:
            contents: Payload for Gemini (prompt text or list of prompt/media parts)
            generation_config: Optional generation configuration dictionary
            preferred_model: Optional override for the primary model

        Returns:
            Tuple of (response_object, model_name_used)

        Raises:
            RuntimeError: If all model candidates and API keys fail
        """
        if not self.is_available():
            raise RuntimeError(
                "Gemini service unavailable. Please check that google-generativeai is installed "
                "and GEMINI_API_KEY is configured."
            )

        api_keys = self.get_api_keys()
        candidates = self.get_model_candidates(preferred_model=preferred_model)

        last_exception: Optional[Exception] = None
        attempt_history: List[str] = []

        for key_idx, api_key in enumerate(api_keys):
            self._configure_key(api_key)
            masked_key = f"...{api_key[-4:]}" if len(api_key) > 4 else f"key#{key_idx + 1}"

            for model_name in candidates:
                try:
                    logger.info(
                        f"🤖 [GeminiManager] Attempting generation with model '{model_name}' "
                        f"(key: {masked_key})"
                    )

                    model = genai.GenerativeModel(model_name)
                    call_kwargs: Dict[str, Any] = {}
                    if generation_config:
                        call_kwargs["generation_config"] = generation_config

                    response = model.generate_content(contents, **call_kwargs)

                    logger.info(
                        f"✅ [GeminiManager] Generation succeeded using model: '{model_name}'"
                    )
                    return response, model_name

                except Exception as exc:
                    last_exception = exc
                    is_quota = self._is_quota_or_transient_error(exc)
                    err_type = "Quota/Rate Limit (429)" if is_quota else "API Error"
                    detail = str(exc).replace("\n", " ")[:150]
                    attempt_history.append(f"{model_name}: {detail}")

                    logger.warning(
                        f"⚠️ [GeminiManager] Model '{model_name}' failed with {err_type}: {detail}. "
                        f"Switching to fallback model..."
                    )
                    # Proceed to next model candidate in loop
                    continue

        # If all candidates across all keys failed
        history_str = " | ".join(attempt_history)
        error_msg = (
            f"All Gemini models exhausted. Failed attempts: [{history_str}]. "
            f"Last error: {last_exception}"
        )
        logger.error(f"❌ [GeminiManager] {error_msg}")
        raise RuntimeError(error_msg)


# Global singleton instance
gemini_manager = GeminiClientManager()

