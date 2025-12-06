# ai-service/services/llt_transformer.py
"""
Linear Law-based Transformation (LLT) Module
Transforms sentiment and feature analysis into actionable rating guidance.

Mathematical Foundation:
- Maps sentiment scores [-1, 1] to rating scale [1, 10] using linear transformation
- Applies weighted factors for comprehensive evaluation
- Provides confidence intervals and justifications
"""
import math


class LLTTransformer:
    """
    Implements Linear Law-based Transformation for evaluation rating guidance.
    Combines multiple analysis factors to suggest appropriate rating ranges.
    """

    def __init__(self):
        # Configurable weights for each factor (must sum to 1.0)
        self.weights = {
            'sentiment': 0.35,      # Text emotional tone
            'skill_count': 0.25,    # Number and quality of skills mentioned
            'text_depth': 0.20,     # Detail and specificity of feedback
            'consistency': 0.20     # Internal consistency (from bias check)
        }
        
        # Quality thresholds
        self.thresholds = {
            'min_words_basic': 30,
            'min_words_detailed': 80,
            'min_skills_adequate': 3,
            'min_skills_excellent': 6
        }

    def transform(self, features: dict, sentiment: dict, bias_check: dict, text: str) -> dict:
        """
        Main LLT transformation function.
        
        Args:
            features: Dict with technical_skills and soft_skills lists
            sentiment: Dict with score, label, breakdown
            bias_check: Dict with consistency_score, passed, flags
            text: Original feedback text for quality assessment
        
        Returns:
            {
                "suggested_rating": float,
                "range": {"min": float, "max": float},
                "confidence": float,
                "breakdown": {...},
                "explanation": str,
                "guidance": [...]
            }
        """
        # Calculate individual components
        sentiment_component = self._calculate_sentiment_component(sentiment)
        skill_component = self._calculate_skill_component(features)
        text_component = self._calculate_text_quality_component(text, features)
        consistency_component = self._calculate_consistency_component(bias_check)
        
        # Apply Linear Transformation with weights
        suggested_rating = (
            sentiment_component * self.weights['sentiment'] +
            skill_component * self.weights['skill_count'] +
            text_component * self.weights['text_depth'] +
            consistency_component * self.weights['consistency']
        )
        
        # Clamp to valid range [1, 10]
        suggested_rating = max(1.0, min(10.0, suggested_rating))
        
        # Calculate confidence based on data quality
        confidence = self._calculate_confidence(features, text, bias_check)
        
        # Generate rating range (wider range for lower confidence)
        range_width = 1.5 if confidence > 0.7 else 2.0
        min_rating = max(1.0, suggested_rating - range_width)
        max_rating = min(10.0, suggested_rating + range_width)
        
        # Generate explanation
        explanation = self._generate_explanation(
            suggested_rating, 
            sentiment, 
            features, 
            text
        )
        
        # Generate actionable guidance
        guidance = self._generate_guidance(
            suggested_rating,
            sentiment,
            features,
            bias_check
        )
        
        return {
            "suggested_rating": round(suggested_rating, 1),
            "range": {
                "min": round(min_rating, 1),
                "max": round(max_rating, 1)
            },
            "confidence": round(confidence, 2),
            "breakdown": {
                "sentiment_contribution": round(sentiment_component * self.weights['sentiment'], 2),
                "skill_contribution": round(skill_component * self.weights['skill_count'], 2),
                "text_quality_contribution": round(text_component * self.weights['text_depth'], 2),
                "consistency_contribution": round(consistency_component * self.weights['consistency'], 2)
            },
            "explanation": explanation,
            "guidance": guidance
        }

    def _calculate_sentiment_component(self, sentiment: dict) -> float:
        """
        Transform sentiment score [-1, 1] to rating scale [1, 10].
        
        Linear transformation formula: rating = (sentiment + 1) * 4.5 + 1
        
        Examples:
        - sentiment = 1.0  → rating = 10.0 (very positive)
        - sentiment = 0.0  → rating = 5.5  (neutral)
        - sentiment = -1.0 → rating = 1.0  (very negative)
        """
        sentiment_score = sentiment.get('score', 0.0)
        # Linear mapping with slight adjustment for neutral bias
        return (sentiment_score + 1) * 4.5 + 1

    def _calculate_skill_component(self, features: dict) -> float:
        """
        Calculate rating contribution based on identified skills.
        More skills mentioned = higher rating potential (shows comprehensive evaluation)
        """
        technical_count = len(features.get('technical_skills', []))
        soft_count = len(features.get('soft_skills', []))
        total_skills = technical_count + soft_count
        
        # Skill-to-rating mapping
        if total_skills >= self.thresholds['min_skills_excellent']:
            return 9.0  # Comprehensive skill coverage
        elif total_skills >= self.thresholds['min_skills_adequate']:
            return 7.0  # Adequate skill coverage
        elif total_skills > 0:
            return 5.5  # Some skills mentioned
        else:
            return 4.0  # No skills identified (incomplete evaluation)

    def _calculate_text_quality_component(self, text: str, features: dict) -> float:
        """
        Assess text quality based on length, detail, and specificity.
        Higher quality feedback = more reliable rating
        """
        word_count = len(text.split())
        skill_count = len(features.get('technical_skills', [])) + len(features.get('soft_skills', []))
        
        # Base score from word count
        if word_count >= self.thresholds['min_words_detailed']:
            base_score = 8.5
        elif word_count >= self.thresholds['min_words_basic']:
            base_score = 6.5
        else:
            base_score = 4.0
        
        # Bonus for skill diversity (indicates detailed observation)
        skill_bonus = min(1.5, skill_count * 0.2)
        
        return min(10.0, base_score + skill_bonus)

    def _calculate_consistency_component(self, bias_check: dict) -> float:
        """
        Convert consistency score [0, 1] to rating scale [1, 10].
        High consistency = reliable evaluation
        """
        consistency_score = bias_check.get('consistency_score', 0.5)
        # Linear mapping: 0 → 1, 1 → 10
        return consistency_score * 9 + 1

    def _calculate_confidence(self, features: dict, text: str, bias_check: dict) -> float:
        """
        Calculate confidence in the suggested rating.
        Based on: data completeness, consistency, and text quality
        """
        word_count = len(text.split())
        skill_count = len(features.get('technical_skills', [])) + len(features.get('soft_skills', []))
        consistency = bias_check.get('consistency_score', 0.5)
        
        # Factor 1: Text length (0-0.4)
        text_factor = min(0.4, word_count / 200)
        
        # Factor 2: Skill identification (0-0.3)
        skill_factor = min(0.3, skill_count * 0.05)
        
        # Factor 3: Consistency (0-0.3)
        consistency_factor = consistency * 0.3
        
        # Base confidence
        base_confidence = 0.3
        
        total_confidence = base_confidence + text_factor + skill_factor + consistency_factor
        
        return min(0.95, total_confidence)

    def _generate_explanation(self, rating: float, sentiment: dict, features: dict, text: str) -> str:
        """
        Generate human-readable explanation for the suggested rating.
        """
        sentiment_label = sentiment.get('label', 'neutral')
        skill_count = len(features.get('technical_skills', [])) + len(features.get('soft_skills', []))
        word_count = len(text.split())
        
        # Determine rating category
        if rating >= 8.5:
            category = "excellent"
        elif rating >= 7.0:
            category = "good"
        elif rating >= 5.5:
            category = "satisfactory"
        elif rating >= 4.0:
            category = "needs improvement"
        else:
            category = "concerning"
        
        explanation = (
            f"Based on analysis, this evaluation suggests a {category} performance rating. "
            f"The feedback has a {sentiment_label} tone, mentions {skill_count} skills, "
            f"and contains {word_count} words of detail. "
        )
        
        # Add specific reasoning
        if sentiment_label == "positive" and skill_count > 5:
            explanation += "Strong positive indicators with comprehensive skill coverage support a higher rating."
        elif sentiment_label == "negative" and skill_count < 3:
            explanation += "Limited positive indicators suggest areas needing significant improvement."
        elif sentiment_label == "neutral":
            explanation += "Mixed feedback indicates average performance with room for growth."
        
        return explanation

    def _generate_guidance(self, rating: float, sentiment: dict, features: dict, bias_check: dict) -> list:
        """
        Generate actionable guidance for the supervisor.
        """
        guidance = []
        
        # Rating-specific guidance
        if rating < 4.0:
            guidance.append({
                "type": "rating_concern",
                "message": "This rating is quite low. Ensure you've provided specific examples and constructive feedback.",
                "priority": "high"
            })
        elif rating > 9.0:
            guidance.append({
                "type": "rating_excellent",
                "message": "Excellent rating indicated. Confirm all achievements are accurately documented.",
                "priority": "medium"
            })
        
        # Sentiment-based guidance
        sentiment_label = sentiment.get('label', 'neutral')
        if sentiment_label == "negative" and rating > 7.0:
            guidance.append({
                "type": "sentiment_rating_mismatch",
                "message": "Your written feedback seems negative but the rating is high. Consider clarifying.",
                "priority": "high"
            })
        
        # Skill coverage guidance
        skill_count = len(features.get('technical_skills', [])) + len(features.get('soft_skills', []))
        if skill_count < 3:
            guidance.append({
                "type": "skills_insufficient",
                "message": "Consider mentioning more specific skills (technical and soft skills) to strengthen evaluation.",
                "priority": "medium"
            })
        
        # Consistency guidance
        if not bias_check.get('passed', True):
            guidance.append({
                "type": "consistency_warning",
                "message": "Potential bias detected. Review the evaluation for consistency between text and ratings.",
                "priority": "high"
            })
        
        return guidance
