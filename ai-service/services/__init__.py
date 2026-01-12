# ai-service/services/__init__.py
"""
AI Service Components for Trend Analysis

Active Components:
- AIEngine: Main orchestrator for trend analysis
- TrendAnalyzer: Core trend analysis logic
- PerformanceAnalyzer: Company and university performance stats
- SkillTrendAnalyzer: Skill demand analysis
- FeatureExtractor: Skill extraction from text
- EnhancedSentimentAnalyzer: Sentiment analysis with context awareness
- SentimentAnalyzer: Basic sentiment analysis (legacy support)

Deprecated Components (kept for reference but not used):
- LLTTransformer: Was used for individual evaluation guidance
- BiasDetector: Was used for individual evaluation validation
- FeedbackGuide: Was used for real-time draft improvement

Version: 2.0.0 - Historical Trend Analysis Focus
"""

from services.ai_engine import AIEngine
from services.trend_analyzer import TrendAnalyzer
from services.performance_analyzer import PerformanceAnalyzer
from services.skill_trend_analyzer import SkillTrendAnalyzer
from services.feature_extractor import FeatureExtractor
from services.enhanced_sentiment_analyzer import EnhancedSentimentAnalyzer
from services.sentiment_analyzer import SentimentAnalyzer

__all__ = [
    'AIEngine',
    'TrendAnalyzer',
    'PerformanceAnalyzer',
    'SkillTrendAnalyzer',
    'FeatureExtractor',
    'EnhancedSentimentAnalyzer',
    'SentimentAnalyzer'
]
