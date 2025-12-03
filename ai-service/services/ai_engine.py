# ai-service/services/ai_engine.py
import time
from services.feature_extractor import FeatureExtractor
from services.sentiment_analyzer import SentimentAnalyzer
from utils.text_cleaner import get_text_length
from services.bias_detector import BiasDetector


class AIEngine:
    """
    Main AI orchestrator that combines all analysis components.
    Coordinates feature extraction, sentiment analysis, and metadata generation.
    """

    def __init__(self):
        self.extractor = FeatureExtractor()
        self.sentiment_analyzer = SentimentAnalyzer()
        self.bias_detector = BiasDetector()
        
    def analyze_evaluation(self, text: str, ratings: dict | None = None) -> dict:
        """
        Complete evaluation analysis pipeline.
        Returns comprehensive AI analysis result.
        """
        start_time = time.time()

        # Run parallel-like analysis
        features = self.extractor.extract(text)
        sentiment_result = self.sentiment_analyzer.analyze(text)
        
         # RUN BIAS DETECTION
        bias_result = self.bias_detector.detect(
            text, 
            ratings or {},
            sentiment_result
        )

        # Calculate confidence score
        # Logic: More detailed text + identified skills = higher confidence
        word_count = get_text_length(text)
        skill_count = len(features["technical_skills"]) + len(features["soft_skills"])

        # Base confidence + skill detection boost + word count factor
        base_confidence = 0.60
        skill_boost = skill_count * 0.05  # Each skill adds 5%
        text_factor = min(0.20, word_count * 0.001)  # Caps at 20%
        
        # Reduce confidence if bias detected
        bias_penalty = 0 if bias_result["passed"] else 0.15
        confidence = min(0.95, base_confidence + skill_boost + text_factor - bias_penalty)

        # Calculate processing time
        processing_time = round((time.time() - start_time) * 1000, 2)

        # Compile final result
        result = {
            "features": features,
            "sentiment": sentiment_result,
            "bias_check": {
            "passed": bias_result["passed"],
            "flags": bias_result["flags"],
            "consistency_score": bias_result["consistency_score"],
            "severity": bias_result["severity"],
        },
            "confidence_score": round(confidence, 2),
            "processing_time_ms": processing_time,
        }

        return result

    def get_health_status(self) -> dict:
        """Simple health check endpoint"""
        return {
            "status": "healthy",
            "components": {
                "feature_extractor": "operational",
                "sentiment_analyzer": "operational",
            },
        }
