"""
Signature Scanner Service - AI-based detection of wet signatures on documents

Uses Google Gemini Vision API to scan uploaded document files (PDF/images) and detect:
- Presence of handwritten/wet signatures
- Confidence score
- Locations/descriptions of found signatures

Supports: PDF, JPEG, PNG file formats
"""

import os
import json
import logging
import requests
from typing import Dict, Any

logger = logging.getLogger(__name__)

# Check for google-generativeai
try:
    import google.generativeai as genai
    GEMINI_AVAILABLE = True
except ImportError:
    GEMINI_AVAILABLE = False
    logger.warning("⚠️ google-generativeai not installed. Signature scanning will use fallback mode.")


class SignatureScanResult:
    """Result of signature scanning"""
    def __init__(
        self,
        status: str = "success",
        has_signature: bool = False,
        confidence_score: float = 0.0,
        notes: str = "",
        error: str = ""
    ):
        self.status = status
        self.has_signature = has_signature
        self.confidence_score = confidence_score
        self.notes = notes
        self.error = error

    def to_dict(self) -> Dict[str, Any]:
        return {
            "status": self.status,
            "has_signature": self.has_signature,
            "confidence_score": self.confidence_score,
            "notes": self.notes,
            "error": self.error
        }


class SignatureScanner:
    """
    Scans document files using Google Gemini Vision API
    to detect the presence of handwritten wet signatures.
    """

    def __init__(self):
        self.api_key = os.getenv("GEMINI_API_KEY", "")
        self.model_name = os.getenv("GEMINI_MODEL", "gemini-2.0-flash")
        
        if GEMINI_AVAILABLE and self.api_key:
            genai.configure(api_key=self.api_key)
            self.model = genai.GenerativeModel(self.model_name)
            logger.info(f"✅ Signature Scanner initialized with Gemini model: {self.model_name}")
        else:
            self.model = None
            if not self.api_key:
                logger.warning("⚠️ GEMINI_API_KEY not set. Signature scanning will not be available.")

    def is_available(self) -> bool:
        """Check if signature scanning is available"""
        return GEMINI_AVAILABLE and bool(self.api_key) and self.model is not None

    async def scan_document(self, file_url: str) -> SignatureScanResult:
        """
        Scan a document file and detect signatures.
        
        Args:
            file_url: Signed URL to the document file (PDF/image)
            
        Returns:
            SignatureScanResult with detection boolean and confidence
        """
        if not self.is_available():
            logger.error("❌ Signature Scanner not available (missing API key or package)")
            return SignatureScanResult(
                status="failed",
                error="AI signature scanning service is not available or properly configured."
            )

        try:
            logger.info(f"🔍 [Signature Scanner] Downloading file from URL...")
            # 1. Download the file content
            response = requests.get(file_url, stream=True)
            if response.status_code != 200:
                logger.error(f"❌ Failed to download file. Status: {response.status_code}")
                return SignatureScanResult(
                    status="failed",
                    error=f"Failed to access the document file (Status: {response.status_code})"
                )

            # Determine mime type from headers or URL
            content_type = response.headers.get("content-type", "")
            if not content_type or "octet-stream" in content_type:
                if ".pdf" in file_url.lower():
                    content_type = "application/pdf"
                elif ".png" in file_url.lower():
                    content_type = "image/png"
                elif ".jpg" in file_url.lower() or ".jpeg" in file_url.lower():
                    content_type = "image/jpeg"
                else:
                    content_type = "application/pdf" # Default fallback

            # 2. Prepare payload for Gemini
            file_data = response.content
            
            logger.info(f"🔍 [Signature Scanner] File downloaded: {len(file_data)} bytes, type: {content_type}")
            
            prompt = """
            Analyze this document carefully. Look for handwritten, physical "wet" signatures or e-signatures.
            Do not mistake printed names, standard typed text, or standard watermarks for signatures.
            A signature is typically cursive or stylized handwritten text used for authorization.
            
            Return ONLY a valid JSON object with the following exact structure:
            {
              "has_signature": boolean (true if AT LEAST ONE handwritten signature is found, false otherwise),
              "confidence_score": number (0.0 to 1.0 indicating how confident you are),
              "notes": string (brief description of where the signature(s) was found, e.g., "Found one signature at the bottom right", or explanation of why none were found)
            }
            """

            # 3. Call Gemini API
            logger.info(f"🧠 [Signature Scanner] Sending to Gemini model: {self.model_name}")
            
            result = self.model.generate_content([
                {"mime_type": content_type, "data": file_data},
                prompt
            ])
            
            response_text = result.text
            
            # 4. Parse the JSON response
            # Sometimes Gemini wraps JSON in markdown block like ```json ... ```
            cleaned_text = response_text.strip()
            if cleaned_text.startswith("```json"):
                cleaned_text = cleaned_text[7:]
            if cleaned_text.startswith("```"):
                cleaned_text = cleaned_text[3:]
            if cleaned_text.endswith("```"):
                cleaned_text = cleaned_text[:-3]
                
            cleaned_text = cleaned_text.strip()
            
            try:
                data = json.loads(cleaned_text)
                
                scan_result = SignatureScanResult(
                    status="success",
                    has_signature=data.get("has_signature", False),
                    confidence_score=float(data.get("confidence_score", 0.0)),
                    notes=data.get("notes", "")
                )
                
                logger.info(f"✅ [Signature Scanner] Scan complete. Has signature: {scan_result.has_signature} (Confidence: {scan_result.confidence_score})")
                return scan_result
                
            except json.JSONDecodeError as je:
                logger.error(f"❌ Failed to parse Gemini response as JSON: {response_text}")
                return SignatureScanResult(
                    status="failed",
                    error="AI returned malformed response."
                )

        except Exception as e:
            logger.error(f"❌ Error during signature scan: {str(e)}", exc_info=True)
            return SignatureScanResult(
                status="failed",
                error=f"Internal error during scanning: {str(e)}"
            )

# Create singleton instance
signature_scanner = SignatureScanner()
