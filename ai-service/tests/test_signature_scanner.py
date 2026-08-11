import pytest
from unittest.mock import patch, AsyncMock, MagicMock
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

class MockSignatureResult:
    def __init__(self, has_signature, confidence_score, notes):
        self.has_signature = has_signature
        self.confidence_score = confidence_score
        self.notes = notes
        
    def to_dict(self):
        return {
            "has_signature": self.has_signature,
            "confidence_score": self.confidence_score,
            "notes": self.notes
        }

@pytest.fixture
def mock_scanner():
    with patch("main.signature_scanner") as mock:
        mock.is_available.return_value = True
        yield mock

def test_scan_signatures_success(mock_scanner):
    """Test successful signature detection"""
    mock_scanner.scan_document = AsyncMock(return_value=MockSignatureResult(True, 0.95, "Signature detected successfully."))
    
    response = client.post(
        "/api/scan-signatures",
        json={"file_url": "http://example.com/doc.pdf", "document_id": "test-doc-1"}
    )
    
    assert response.status_code == 200
    data = response.json()
    assert data["has_signature"] is True
    assert data["confidence_score"] == 0.95
    
def test_scan_signatures_missing(mock_scanner):
    """Test behavior when no signature is detected"""
    mock_scanner.scan_document = AsyncMock(return_value=MockSignatureResult(False, 0.1, "No signature detected."))
    
    response = client.post(
        "/api/scan-signatures",
        json={"file_url": "http://example.com/doc.pdf"}
    )
    
    assert response.status_code == 200
    data = response.json()
    assert data["has_signature"] is False
    assert data["confidence_score"] == 0.1

def test_scan_signatures_no_url(mock_scanner):
    """Test validation for missing file_url"""
    response = client.post(
        "/api/scan-signatures",
        json={"document_id": "test"} # Missing file_url
    )
    
    # FastAPI validation error
    assert response.status_code == 422
    
def test_scan_signatures_unavailable():
    """Test behavior when scanner is unavailable (e.g. no API key)"""
    with patch("main.signature_scanner") as mock:
        mock.is_available.return_value = False
        
        response = client.post(
            "/api/scan-signatures",
            json={"file_url": "http://example.com/doc.pdf"}
        )
        
        assert response.status_code == 503
        assert "not configured" in response.json()["detail"]
