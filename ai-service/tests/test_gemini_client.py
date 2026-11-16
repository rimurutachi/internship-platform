import pytest
from unittest.mock import patch, MagicMock
from utils.gemini_client import GeminiClientManager


def test_gemini_candidates_ordering():
    with patch.dict('os.environ', {
        'GEMINI_MODEL': 'gemini-3.5-flash-lite',
        'GEMINI_FALLBACK_MODELS': 'gemini-3.1-flash-lite,gemini-3.8-flash,gemini-2.5-flash'
    }):
        mgr = GeminiClientManager()
        candidates = mgr.get_model_candidates()
        assert candidates[0] == 'gemini-3.5-flash-lite'
        assert candidates[1] == 'gemini-3.1-flash-lite'
        assert 'gemini-3.8-flash' in candidates
        assert 'gemini-2.5-flash' in candidates


def test_gemini_fallback_on_429():
    with patch.dict('os.environ', {
        'GEMINI_API_KEY': 'test_key',
        'GEMINI_MODEL': 'gemini-3.5-flash-lite',
        'GEMINI_FALLBACK_MODELS': 'gemini-3.1-flash-lite'
    }), patch('utils.gemini_client.genai') as mock_genai:
        mgr = GeminiClientManager()

        # Primary model mock (fails with 429 quota exceeded)
        primary_model = MagicMock()
        primary_model.generate_content.side_effect = Exception("429 You exceeded your current quota: RESOURCE_EXHAUSTED")

        # Fallback model mock (succeeds)
        fallback_model = MagicMock()
        mock_response = MagicMock()
        mock_response.text = "Success response from fallback"
        fallback_model.generate_content.return_value = mock_response

        def get_model(name):
            if name == 'gemini-3.5-flash-lite':
                return primary_model
            return fallback_model

        mock_genai.GenerativeModel.side_effect = get_model

        response, model_used = mgr.generate_content("hello")
        assert model_used == 'gemini-3.1-flash-lite'
        assert response.text == "Success response from fallback"


def test_gemini_exhausts_all_models():
    with patch.dict('os.environ', {
        'GEMINI_API_KEY': 'test_key',
        'GEMINI_MODEL': 'gemini-3.5-flash-lite',
        'GEMINI_FALLBACK_MODELS': 'gemini-3.1-flash-lite'
    }), patch('utils.gemini_client.genai') as mock_genai:
        mgr = GeminiClientManager()

        failing_model = MagicMock()
        failing_model.generate_content.side_effect = Exception("429 RESOURCE_EXHAUSTED")
        mock_genai.GenerativeModel.return_value = failing_model

        with pytest.raises(RuntimeError) as exc_info:
            mgr.generate_content("hello")

        assert "All Gemini models exhausted" in str(exc_info.value)

