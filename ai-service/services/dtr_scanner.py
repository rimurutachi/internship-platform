"""
DTR Scanner Service - AI-based extraction of hours from Weekly DTR documents

Uses Google Gemini Vision API to scan uploaded DTR files (PDF/images) and extract:
- Daily time-in/time-out entries
- Total hours per day
- Total hours for the week
- Confidence score

Supports: PDF, JPEG, PNG file formats
"""

import os
import io
import re
import json
import logging
import requests
import time
from typing import Optional, Dict, Any, List

logger = logging.getLogger(__name__)

# Check for google-generativeai
try:
    import google.generativeai as genai
    GEMINI_AVAILABLE = True
except ImportError:
    GEMINI_AVAILABLE = False
    logger.warning("⚠️ google-generativeai not installed. DTR scanning will use fallback mode.")


class DTRScanResult:
    """Result of DTR scanning"""
    def __init__(
        self,
        status: str = "success",
        total_hours: float = 0,
        daily_breakdown: List[Dict[str, Any]] = None,
        confidence_score: float = 0,
        notes: str = "",
        error: str = ""
    ):
        self.status = status
        self.total_hours = total_hours
        self.daily_breakdown = daily_breakdown or []
        self.confidence_score = confidence_score
        self.notes = notes
        self.error = error

    def to_dict(self) -> Dict[str, Any]:
        return {
            "status": self.status,
            "total_hours": self.total_hours,
            "daily_breakdown": self.daily_breakdown,
            "confidence_score": self.confidence_score,
            "notes": self.notes,
            "error": self.error
        }


class DTRScanner:
    """
    Scans DTR (Daily Time Record) documents using Google Gemini Vision API
    to extract rendered hours for internship tracking.
    """

    def __init__(self):
        self.api_key = os.getenv("GEMINI_API_KEY", "")
        self.model_name = os.getenv("GEMINI_MODEL", "gemini-2.0-flash")
        
        if GEMINI_AVAILABLE and self.api_key:
            genai.configure(api_key=self.api_key)
            self.model = genai.GenerativeModel(self.model_name)
            logger.info(f"✅ DTR Scanner initialized with Gemini model: {self.model_name}")
        else:
            self.model = None
            if not self.api_key:
                logger.warning("⚠️ GEMINI_API_KEY not set. DTR scanning will not be available.")
            if not GEMINI_AVAILABLE:
                logger.warning("⚠️ google-generativeai package not available.")

    def is_available(self) -> bool:
        """Check if DTR scanning is available"""
        return GEMINI_AVAILABLE and bool(self.api_key) and self.model is not None

    async def scan_dtr(self, file_url: str) -> DTRScanResult:
        """
        Scan a DTR file and extract hours information.
        
        Args:
            file_url: Signed URL to the DTR file (PDF/image)
            
        Returns:
            DTRScanResult with extracted hours and breakdown
        """
        if not self.is_available():
            logger.error("❌ DTR Scanner not available (missing API key or package)")
            return DTRScanResult(
                status="failed",
                error="DTR scanning service is not configured. Please set GEMINI_API_KEY."
            )

        try:
            logger.info(f"🤖 [DTRScanner] Starting DTR scan...")
            start_time = time.time()

            # 1. Download the file
            file_bytes, mime_type = await self._download_file(file_url)
            
            if not file_bytes:
                return DTRScanResult(
                    status="failed",
                    error="Failed to download DTR file"
                )

            logger.info(f"📄 [DTRScanner] File downloaded: {len(file_bytes)} bytes, type: {mime_type}")

            # 2. Send to Gemini Vision for analysis
            result = await self._analyze_with_gemini(file_bytes, mime_type)
            
            elapsed = round(time.time() - start_time, 2)
            logger.info(f"✅ [DTRScanner] Scan complete in {elapsed}s: {result.total_hours} hours extracted")

            return result

        except Exception as e:
            logger.error(f"❌ [DTRScanner] Scan error: {str(e)}", exc_info=True)
            return DTRScanResult(
                status="failed",
                error=str(e)
            )

    async def _download_file(self, file_url: str) -> tuple:
        """Download a file from URL and return bytes + mime type"""
        try:
            response = requests.get(file_url, timeout=30)
            response.raise_for_status()
            
            content_type = response.headers.get('Content-Type', 'application/octet-stream')
            
            # Determine mime type
            if 'pdf' in content_type.lower():
                mime_type = 'application/pdf'
            elif 'png' in content_type.lower():
                mime_type = 'image/png'
            elif 'jpeg' in content_type.lower() or 'jpg' in content_type.lower():
                mime_type = 'image/jpeg'
            else:
                # Try to infer from URL
                url_lower = file_url.lower()
                if '.pdf' in url_lower:
                    mime_type = 'application/pdf'
                elif '.png' in url_lower:
                    mime_type = 'image/png'
                elif '.jpg' in url_lower or '.jpeg' in url_lower:
                    mime_type = 'image/jpeg'
                else:
                    mime_type = content_type
            
            return response.content, mime_type
            
        except Exception as e:
            logger.error(f"❌ [DTRScanner] Download failed: {str(e)}")
            return None, None

    async def _analyze_with_gemini(self, file_bytes: bytes, mime_type: str) -> DTRScanResult:
        """Send file to Gemini Vision API for DTR analysis"""
        
        prompt = """You are an expert at reading Daily Time Records (DTR) for internship/OJT students in the Philippines.

Analyze this DTR document carefully and extract the following information:

1. **Daily time entries**: For each day shown in the DTR, extract:
   - Date (in YYYY-MM-DD format)
   - Time In (morning arrival, in HH:MM 24h format)
   - Time Out (evening departure, in HH:MM 24h format)  
   - Lunch break time if visible (usually 1 hour)
   - Total hours worked that day (excluding lunch break)

2. **Total hours for the week**: Sum up all daily hours

IMPORTANT RULES:
- If lunch break is shown, deduct it from the daily hours (typically 1 hour)
- If lunch break is not explicitly shown but the time range spans a full day (e.g., 8AM-5PM), assume 1 hour lunch break
- Round hours to 1 decimal place
- If a date field shows "No work" or is empty/blank, report 0 hours for that day
- If the document is unclear or partially illegible, note this and provide your best estimate
- Look for handwritten or printed time entries

Respond ONLY with a valid JSON object in this exact format (no markdown, no code blocks, just raw JSON):
{
  "total_hours": 40.0,
  "daily_breakdown": [
    {
      "date": "2026-04-21",
      "day": "Monday",
      "time_in": "08:00",
      "time_out": "17:00",
      "lunch_break_hours": 1.0,
      "hours": 8.0
    }
  ],
  "confidence_score": 0.95,
  "notes": "Any relevant notes about the scan, e.g., 'Some entries were handwritten and slightly unclear'"
}

If you cannot read the document at all, respond with:
{
  "total_hours": 0,
  "daily_breakdown": [],
  "confidence_score": 0,
  "notes": "Unable to read document: [reason]"
}"""

        try:
            # Create the file part for Gemini
            file_part = {
                "mime_type": mime_type,
                "data": file_bytes
            }

            # Generate response
            response = self.model.generate_content(
                [prompt, file_part],
                generation_config={
                    "temperature": 0.1,  # Low temperature for accuracy
                    "max_output_tokens": 4096,
                }
            )

            # Parse the response
            response_text = response.text.strip()
            
            # Clean up response - remove markdown code blocks if present
            if response_text.startswith("```"):
                # Remove ```json and ``` markers
                response_text = re.sub(r'^```(?:json)?\s*', '', response_text)
                response_text = re.sub(r'\s*```$', '', response_text)
            
            logger.info(f"🤖 [DTRScanner] Raw Gemini response: {response_text[:200]}...")

            # Parse JSON
            parsed = json.loads(response_text)
            
            return DTRScanResult(
                status="success",
                total_hours=float(parsed.get("total_hours", 0)),
                daily_breakdown=parsed.get("daily_breakdown", []),
                confidence_score=float(parsed.get("confidence_score", 0)),
                notes=parsed.get("notes", "")
            )

        except json.JSONDecodeError as e:
            logger.error(f"❌ [DTRScanner] Failed to parse Gemini response as JSON: {e}")
            logger.error(f"Raw response: {response_text[:500]}")
            
            # Try to extract hours from the text response as fallback
            total_hours = self._extract_hours_fallback(response_text)
            
            return DTRScanResult(
                status="success" if total_hours > 0 else "failed",
                total_hours=total_hours,
                confidence_score=0.3,  # Low confidence for fallback
                notes=f"Parsed using fallback text extraction. Original response was not valid JSON.",
                error="" if total_hours > 0 else "Failed to parse AI response"
            )

        except Exception as e:
            logger.error(f"❌ [DTRScanner] Gemini analysis error: {str(e)}", exc_info=True)
            return DTRScanResult(
                status="failed",
                error=f"AI analysis error: {str(e)}"
            )

    def _extract_hours_fallback(self, text: str) -> float:
        """Fallback: try to extract total hours from text response"""
        try:
            # Look for patterns like "total_hours": 40 or "Total: 40 hours"
            patterns = [
                r'"total_hours":\s*(\d+\.?\d*)',
                r'[Tt]otal\s*(?:hours?)?\s*[:=]\s*(\d+\.?\d*)',
                r'(\d+\.?\d*)\s*(?:total\s+)?hours?\s+(?:total|worked)',
            ]
            
            for pattern in patterns:
                match = re.search(pattern, text)
                if match:
                    return float(match.group(1))
            
            return 0
        except Exception:
            return 0


# Singleton instance
dtr_scanner = DTRScanner()
