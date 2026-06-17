import pytest
from unittest.mock import patch, MagicMock, AsyncMock
import json
from services.dtr_scanner import DTRScanner, DTRScanResult

@pytest.fixture
def mock_dtr_scanner():
    with patch('services.dtr_scanner.GEMINI_AVAILABLE', True), \
         patch('services.dtr_scanner.os.getenv', return_value='dummy_key'), \
         patch('services.dtr_scanner.genai'):
        scanner = DTRScanner()
        # Mock model since we don't want real API calls
        scanner.model = MagicMock()
        yield scanner

@pytest.mark.asyncio
async def test_dtr_scanner_initialization():
    with patch('services.dtr_scanner.GEMINI_AVAILABLE', False):
        scanner = DTRScanner()
        assert not scanner.is_available()

    with patch('services.dtr_scanner.GEMINI_AVAILABLE', True), \
         patch('services.dtr_scanner.os.getenv', return_value=''), \
         patch('services.dtr_scanner.genai'):
        scanner = DTRScanner()
        assert not scanner.is_available()

@pytest.mark.asyncio
async def test_scan_dtr_success(mock_dtr_scanner):
    # Mock download
    mock_dtr_scanner._download_file = AsyncMock(return_value=(b"dummy bytes", "image/jpeg"))
    
    # Mock analyze
    mock_result = DTRScanResult(status="success", total_hours=40.0)
    mock_dtr_scanner._analyze_with_gemini = AsyncMock(return_value=mock_result)

    result = await mock_dtr_scanner.scan_dtr("http://dummy.url/file.jpg")
    
    assert result.status == "success"
    assert result.total_hours == 40.0
    mock_dtr_scanner._download_file.assert_called_once_with("http://dummy.url/file.jpg")
    mock_dtr_scanner._analyze_with_gemini.assert_called_once_with(b"dummy bytes", "image/jpeg")

@pytest.mark.asyncio
async def test_scan_dtr_unavailable():
    with patch('services.dtr_scanner.GEMINI_AVAILABLE', False):
        scanner = DTRScanner()
        result = await scanner.scan_dtr("http://dummy.url/file.jpg")
        assert result.status == "failed"
        assert "not configured" in result.error

@pytest.mark.asyncio
async def test_scan_dtr_download_fail(mock_dtr_scanner):
    # Mock download failure
    mock_dtr_scanner._download_file = AsyncMock(return_value=(None, None))
    
    result = await mock_dtr_scanner.scan_dtr("http://dummy.url/file.jpg")
    
    assert result.status == "failed"
    assert "Failed to download" in result.error

@pytest.mark.asyncio
async def test_download_file(mock_dtr_scanner):
    # Test valid URL
    with patch('services.dtr_scanner.requests.get') as mock_get:
        mock_response = MagicMock()
        mock_response.content = b"pdf content"
        mock_response.headers = {'Content-Type': 'application/pdf'}
        mock_get.return_value = mock_response
        
        file_bytes, mime_type = await mock_dtr_scanner._download_file("http://dummy.url/file.pdf")
        
        assert file_bytes == b"pdf content"
        assert mime_type == "application/pdf"
        
    # Test download infer from URL
    with patch('services.dtr_scanner.requests.get') as mock_get:
        mock_response = MagicMock()
        mock_response.content = b"png content"
        mock_response.headers = {'Content-Type': 'application/octet-stream'}
        mock_get.return_value = mock_response
        
        file_bytes, mime_type = await mock_dtr_scanner._download_file("http://dummy.url/file.png")
        assert mime_type == "image/png"
        
    # Test download error
    with patch('services.dtr_scanner.requests.get', side_effect=Exception("Network error")):
        file_bytes, mime_type = await mock_dtr_scanner._download_file("http://dummy.url/file.pdf")
        assert file_bytes is None
        assert mime_type is None

@pytest.mark.asyncio
async def test_analyze_with_gemini_success(mock_dtr_scanner):
    mock_response = MagicMock()
    mock_response.text = '{"total_hours": 35.5, "daily_breakdown": [], "confidence_score": 0.9, "notes": ""}'
    mock_dtr_scanner.model.generate_content.return_value = mock_response
    
    result = await mock_dtr_scanner._analyze_with_gemini(b"dummy image", "image/jpeg")
    
    assert result.status == "success"
    assert result.total_hours == 35.5
    assert result.confidence_score == 0.9

@pytest.mark.asyncio
async def test_analyze_with_gemini_markdown_json(mock_dtr_scanner):
    mock_response = MagicMock()
    mock_response.text = '```json\n{"total_hours": 35.5}\n```'
    mock_dtr_scanner.model.generate_content.return_value = mock_response
    
    result = await mock_dtr_scanner._analyze_with_gemini(b"dummy image", "image/jpeg")
    
    assert result.status == "success"
    assert result.total_hours == 35.5

@pytest.mark.asyncio
async def test_analyze_with_gemini_fallback(mock_dtr_scanner):
    mock_response = MagicMock()
    # Invalid JSON but contains the text pattern
    mock_response.text = 'The total hours worked is 40.5 hours for the week.'
    mock_dtr_scanner.model.generate_content.return_value = mock_response
    
    result = await mock_dtr_scanner._analyze_with_gemini(b"dummy image", "image/jpeg")
    
    assert result.status == "success"
    assert result.total_hours == 40.5
    assert "fallback" in result.notes

@pytest.mark.asyncio
async def test_analyze_with_gemini_error(mock_dtr_scanner):
    mock_dtr_scanner.model.generate_content.side_effect = Exception("API Error")
    
    result = await mock_dtr_scanner._analyze_with_gemini(b"dummy image", "image/jpeg")
    
    assert result.status == "failed"
    assert "API Error" in result.error
