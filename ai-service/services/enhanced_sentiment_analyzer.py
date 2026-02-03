# ai-service/services/enhanced_sentiment_analyzer.py
"""
Enhanced Sentiment Analyzer with Context Awareness
Improves upon basic TextBlob sentiment by detecting:
- Feedback tone (constructive, harsh, praise)
- Contextual phrases (improvement areas, strengths)
- Intensity modifiers
- Balanced feedback patterns
"""
from textblob import TextBlob
import re


class EnhancedSentimentAnalyzer:
    """
    Context-aware sentiment analysis for internship evaluations.
    Provides deeper insights beyond simple polarity scores.
    """

    def __init__(self):
        # Positive intensity words
        self.positive_intensifiers = [
            'excellent', 'outstanding', 'exceptional', 'superb', 'remarkable',
            'impressive', 'fantastic', 'phenomenal', 'exceeded', 'stellar'
        ]
        
        # Negative intensity words
        self.negative_intensifiers = [
            'terrible', 'awful', 'poor', 'unacceptable', 'disappointing',
            'inadequate', 'lacking', 'failed', 'struggled', 'deficient'
        ]
        
        # Constructive feedback indicators
        self.constructive_phrases = [
            'could improve', 'needs improvement', 'should work on', 'opportunity to',
            'would benefit from', 'room for growth', 'consider improving',
            'suggest working on', 'area for development'
        ]
        
        # Praise indicators
        self.praise_phrases = [
            'went above and beyond', 'exceeded expectations', 'consistently delivered',
            'demonstrated excellence', 'showed great', 'performed admirably',
            'highly skilled', 'exceptional work', 'outstanding performance'
        ]
        
        # Concern indicators
        self.concern_phrases = [
            'concerned about', 'disappointed by', 'failed to meet', 'below expectations',
            'lack of', 'insufficient', 'did not demonstrate', 'missing', 'absent'
        ]
        
        # Balance indicators (transitional phrases)
        self.balance_indicators = ['however', 'but', 'although', 'while', 'despite', 'yet']

    def analyze(self, text: str) -> dict:
        """
        Perform enhanced sentiment analysis with contextual understanding.
        
        Returns:
            {
                "score": float (-1 to 1),
                "label": str (positive | neutral | negative),
                "tone": str (praise | constructive | harsh | balanced),
                "intensity": str (mild | moderate | strong),
                "context_flags": {...},
                "insights": [list of actionable insights],
                "breakdown": {...}
            }
        """
        # Base TextBlob analysis
        blob = TextBlob(text)
        base_polarity = blob.sentiment.polarity
        subjectivity = blob.sentiment.subjectivity
        
        # Context-aware adjustments
        adjusted_polarity = self._adjust_for_context(text, base_polarity)
        
        # Detect tone
        tone = self._detect_feedback_tone(text)
        
        # Detect intensity
        intensity = self._detect_intensity(text, adjusted_polarity)
        
        # Identify context flags
        context_flags = self._identify_context_flags(text)
        
        # Generate insights
        insights = self._generate_insights(text, adjusted_polarity, tone, context_flags)
        
        # Calculate label
        label = self._get_label(adjusted_polarity)
        
        # Calculate breakdown
        breakdown = self._calculate_breakdown(adjusted_polarity)
        
        return {
            "score": round(adjusted_polarity, 2),
            "label": label,
            "tone": tone,
            "intensity": intensity,
            "subjectivity": round(subjectivity, 2),
            "context_flags": context_flags,
            "insights": insights,
            "breakdown": breakdown
        }

    def _adjust_for_context(self, text: str, base_polarity: float) -> float:
        """
        Adjust sentiment score based on contextual understanding.
        """
        text_lower = text.lower()
        adjustment = 0
        
        # Check for intensifiers
        for intensifier in self.positive_intensifiers:
            if intensifier in text_lower:
                adjustment += 0.1  # Boost positive sentiment
        
        for intensifier in self.negative_intensifiers:
            if intensifier in text_lower:
                adjustment -= 0.1  # Lower sentiment
        
        # Check for constructive feedback (slightly reduces negativity)
        for phrase in self.constructive_phrases:
            if phrase in text_lower:
                adjustment += 0.05  # Constructive is less harsh than pure negative
        
        # Apply adjustment and clamp
        adjusted = base_polarity + adjustment
        return max(-1.0, min(1.0, adjusted))

    def _detect_feedback_tone(self, text: str) -> str:
        """
        Detect overall tone of the feedback.
        Returns: praise | constructive | harsh | balanced
        """
        text_lower = text.lower()
        
        # Count indicators
        praise_count = sum(1 for phrase in self.praise_phrases if phrase in text_lower)
        constructive_count = sum(1 for phrase in self.constructive_phrases if phrase in text_lower)
        concern_count = sum(1 for phrase in self.concern_phrases if phrase in text_lower)
        balance_count = sum(1 for word in self.balance_indicators if word in text_lower)
        
        # Determine tone
        if balance_count > 0 and (praise_count > 0 or constructive_count > 0):
            return "balanced"
        elif praise_count > concern_count and praise_count > 0:
            return "praise"
        elif constructive_count > 0 or (concern_count > 0 and constructive_count > 0):
            return "constructive"
        elif concern_count > 1:
            return "harsh"
        else:
            return "neutral"

    def _detect_intensity(self, text: str, polarity: float) -> str:
        """
        Detect intensity of sentiment expression.
        Returns: mild | moderate | strong
        """
        text_lower = text.lower()
        
        # Count intensifiers
        intensifier_count = sum(
            1 for word in (self.positive_intensifiers + self.negative_intensifiers)
            if word in text_lower
        )
        
        # Check for exclamation marks (indicates strong emotion)
        exclamation_count = text.count('!')
        
        # Check for uppercase words (indicates emphasis)
        uppercase_words = len(re.findall(r'\b[A-Z]{2,}\b', text))
        
        # Calculate intensity score
        intensity_score = intensifier_count + (exclamation_count * 0.5) + (uppercase_words * 0.5)
        
        if intensity_score >= 3 or abs(polarity) > 0.7:
            return "strong"
        elif intensity_score >= 1 or abs(polarity) > 0.3:
            return "moderate"
        else:
            return "mild"

    def _identify_context_flags(self, text: str) -> dict:
        """
        Identify specific contextual elements in the feedback.
        """
        text_lower = text.lower()
        
        return {
            "has_praise": any(phrase in text_lower for phrase in self.praise_phrases),
            "has_concerns": any(phrase in text_lower for phrase in self.concern_phrases),
            "has_constructive": any(phrase in text_lower for phrase in self.constructive_phrases),
            "is_balanced": any(word in text_lower for word in self.balance_indicators),
            "mentions_improvement": "improve" in text_lower or "improvement" in text_lower,
            "mentions_excellence": any(word in text_lower for word in ['excellent', 'outstanding', 'exceptional'])
        }

    def _generate_insights(self, text: str, polarity: float, tone: str, flags: dict) -> list:
        """
        Generate actionable insights based on sentiment analysis.
        """
        insights = []
        
        # Insight 1: Tone-specific guidance
        if tone == "harsh" and polarity < -0.5:
            insights.append({
                "type": "tone_warning",
                "message": "Feedback appears quite critical. Consider adding constructive suggestions.",
                "suggestion": "Balance criticism with actionable improvement steps."
            })
        elif tone == "praise" and not flags["has_constructive"]:
            insights.append({
                "type": "completeness",
                "message": "Great positive feedback! Consider adding areas for growth.",
                "suggestion": "Even strong performers can benefit from developmental feedback."
            })
        elif tone == "balanced":
            insights.append({
                "type": "quality",
                "message": "Well-balanced feedback that acknowledges both strengths and areas for improvement.",
                "suggestion": "Continue this approach for constructive evaluations."
            })
        
        # Insight 2: Constructive feedback check
        if polarity < 0 and not flags["has_constructive"]:
            insights.append({
                "type": "constructiveness",
                "message": "Negative feedback detected without improvement suggestions.",
                "suggestion": "Add specific recommendations on how the intern can improve."
            })
        
        # Insight 3: Specificity check
        if polarity > 0.5 and not flags["mentions_excellence"]:
            insights.append({
                "type": "specificity",
                "message": "Positive evaluation could be strengthened with specific examples.",
                "suggestion": "Mention specific achievements or exceptional qualities."
            })
        
        return insights

    def _get_label(self, polarity: float) -> str:
        """
        Convert polarity score to simple label.
        """
        if polarity > 0.2:
            return "positive"
        elif polarity < -0.2:
            return "negative"
        else:
            return "neutral"

    def _calculate_breakdown(self, polarity: float) -> dict:
        """
        Calculate sentiment breakdown percentages.
        """
        if polarity > 0:
            positive_score = (polarity + 1) / 2
            negative_score = 0
            neutral_score = 1 - positive_score
        elif polarity < 0:
            negative_score = abs(polarity)
            positive_score = 0
            neutral_score = 1 - negative_score
        else:
            positive_score = 0
            negative_score = 0
            neutral_score = 1.0
        
        return {
            "positive": round(positive_score, 2),
            "neutral": round(neutral_score, 2),
            "negative": round(negative_score, 2)
        }
