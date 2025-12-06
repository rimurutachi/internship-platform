# ai-service/services/ai_engine.py
import time
from services.feature_extractor import FeatureExtractor
from services.sentiment_analyzer import SentimentAnalyzer
from services.enhanced_sentiment_analyzer import EnhancedSentimentAnalyzer
from services.llt_transformer import LLTTransformer
from services.feedback_guide import FeedbackGuide
from utils.text_cleaner import get_text_length
from services.bias_detector import BiasDetector


class AIEngine:
    """
    Main AI orchestrator that combines all analysis components.
    Coordinates feature extraction, sentiment analysis, LLT transformation, and guidance.
    
    Phase 1 Enhancements:
    - Enhanced sentiment analysis with context awareness
    - LLT (Linear Law-based Transformation) for rating guidance
    - Real-time feedback quality guidance
    """

    def __init__(self):
        self.extractor = FeatureExtractor()
        self.sentiment_analyzer = SentimentAnalyzer()  # Keep for backward compatibility
        self.enhanced_sentiment = EnhancedSentimentAnalyzer()  # NEW: Phase 1
        self.llt_transformer = LLTTransformer()  # NEW: Phase 1
        self.feedback_guide = FeedbackGuide()  # NEW: Phase 1
        self.bias_detector = BiasDetector()
        
    def analyze_evaluation(self, text: str, ratings: dict | None = None, use_enhanced: bool = True) -> dict:
        """
        Complete evaluation analysis pipeline with Phase 1 enhancements.
        
        Args:
            text: Evaluation feedback text
            ratings: Optional dict with rating_overall, rating_technical, etc.
            use_enhanced: Use enhanced sentiment analysis (default: True)
        
        Returns comprehensive AI analysis result with LLT guidance.
        """
        start_time = time.time()

        # Run parallel-like analysis
        features = self.extractor.extract(text)
        
        # Use enhanced or basic sentiment analysis
        if use_enhanced:
            sentiment_result = self.enhanced_sentiment.analyze(text)
        else:
            sentiment_result = self.sentiment_analyzer.analyze(text)
        
        # RUN BIAS DETECTION
        bias_result = self.bias_detector.detect(
            text, 
            ratings or {},
            sentiment_result
        )
        
        # NEW: LLT Transformation for Rating Guidance
        llt_result = self.llt_transformer.transform(
            features=features,
            sentiment=sentiment_result,
            bias_check=bias_result,
            text=text
        )
        
        # NEW: Feedback Quality Guidance
        current_analysis = {
            'features': features,
            'sentiment': sentiment_result,
            'bias_check': bias_result
        }
        guidance_result = self.feedback_guide.analyze_draft(text, current_analysis)

        # Calculate confidence score (enhanced version)
        word_count = get_text_length(text)
        skill_count = len(features["technical_skills"]) + len(features["soft_skills"])

        # Use LLT confidence as base
        confidence = llt_result['confidence']
        
        # Adjust based on feedback quality
        quality_factor = guidance_result['quality_score'] / 100
        confidence = (confidence * 0.7) + (quality_factor * 0.3)  # Weighted average

        # Calculate processing time
        processing_time = round((time.time() - start_time) * 1000, 2)

        # Compile final result with Phase 1 enhancements
        result = {
            "features": features,
            "sentiment": sentiment_result,
            "bias_check": {
                "passed": bias_result["passed"],
                "flags": bias_result["flags"],
                "consistency_score": bias_result["consistency_score"],
                "severity": bias_result["severity"],
            },
            "llt_guidance": llt_result,  # NEW: Phase 1
            "feedback_quality": guidance_result,  # NEW: Phase 1
            "confidence_score": round(confidence, 2),
            "processing_time_ms": processing_time,
        }

        return result

    def get_health_status(self) -> dict:
        """Health check with Phase 1 component status"""
        return {
            "status": "healthy",
            "version": "1.1.0-phase1",
            "components": {
                "feature_extractor": "operational",
                "sentiment_analyzer": "operational",
                "enhanced_sentiment": "operational",  # NEW
                "llt_transformer": "operational",  # NEW
                "feedback_guide": "operational",  # NEW
                "bias_detector": "operational",
            },
            "enhancements": [
                "Context-aware sentiment analysis",
                "LLT rating guidance",
                "Real-time feedback quality assessment"
            ]
        }
