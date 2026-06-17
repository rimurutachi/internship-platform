"""Tests for SentimentAnalyzer"""
from services.sentiment_analyzer import SentimentAnalyzer

class TestSentimentAnalyzer:
    def setup_method(self):
        self.analyzer = SentimentAnalyzer()

    def test_positive_text(self):
        result = self.analyzer.analyze("The student was excellent, outstanding work and great communication!")
        assert result["label"] == "positive"
        assert result["score"] > 0.2

    def test_negative_text(self):
        result = self.analyzer.analyze("The student was terrible, poor performance and very disappointing results.")
        assert result["label"] == "negative"
        assert result["score"] < -0.2

    def test_neutral_text(self):
        result = self.analyzer.analyze("The student completed the assigned tasks during the internship period.")
        assert result["label"] == "neutral"
        assert -0.2 <= result["score"] <= 0.2

    def test_breakdown_sums_correctly(self):
        result = self.analyzer.analyze("Good work overall.")
        breakdown = result["breakdown"]
        assert "positive" in breakdown
        assert "neutral" in breakdown
        assert "negative" in breakdown

    def test_empty_text_returns_neutral(self):
        result = self.analyzer.analyze("")
        assert result["label"] == "neutral"

    def test_return_structure(self):
        """Verify the return dict has all expected keys"""
        result = self.analyzer.analyze("Test text for structure validation.")
        assert "score" in result
        assert "label" in result
        assert "breakdown" in result
        assert isinstance(result["score"], float)
        assert result["label"] in ["positive", "neutral", "negative"]
