# ai-service/services/bias_detector.py
"""
Bias Detection Module
Implements mathematical consistency checks between sentiment and ratings
to detect potentially biased evaluations.
"""


class BiasDetector:
    """
    Detects bias in evaluations by comparing:
    1. Sentiment Score (from text analysis) vs Numeric Rating (1-10)
    2. Text Sentiment vs Number of Positive/Negative keywords
    3. Evaluation consistency patterns
    """

    # Thresholds for bias detection
    SENTIMENT_RATING_THRESHOLD = 0.6  # Inconsistency threshold
    MIN_TEXT_LENGTH_FOR_ANALYSIS = 20  # Words

    def __init__(self):
        self.bias_flags = []
        self.consistency_score = 1.0

    def detect(self, feedback_text: str, ratings: dict, sentiment_result: dict) -> dict:
        """
        Main bias detection method
        
        Args:
            feedback_text: The written feedback
            ratings: Dict with keys: overall, technical, communication, work_ethic (1-10 scale)
            sentiment_result: Output from sentiment analyzer
        
        Returns:
            {
                "passed": bool,
                "flags": [list of detected bias issues],
                "consistency_score": float (0-1),
                "severity": "low" | "medium" | "high",
                "details": {...}
            }
        """
        self.bias_flags = []
        self.consistency_score = 1.0

        # Get numeric values
        overall_rating = ratings.get("rating_overall", 5)  # Default middle value
        avg_rating = self._get_average_rating(ratings)
        sentiment_score = sentiment_result.get("score", 0)  # -1 to 1
        sentiment_label = sentiment_result.get("label", "neutral")

        # Check 1: Sentiment vs Overall Rating Inconsistency
        self._check_sentiment_rating_consistency(
            sentiment_score, overall_rating, sentiment_label
        )

        # Check 2: Text Extremism (Very short feedback with extreme ratings)
        text_word_count = len(feedback_text.split())
        self._check_text_extremism(text_word_count, overall_rating, sentiment_score)

        # Check 3: Multi-rating Inconsistency (e.g., 10 in one area but 1 in another)
        self._check_rating_variance(ratings)

        # Check 4: Sentiment Keyword vs Rating Mismatch
        self._check_keyword_rating_alignment(sentiment_label, overall_rating)

        # Calculate overall consistency score
        self._calculate_consistency_score()

        # Determine severity
        severity = self._determine_severity()

        # Determine if evaluation passed bias check
        passed = len(self.bias_flags) <= 1  # Allow 1 minor flag

        return {
            "passed": passed,
            "flags": self.bias_flags,
            "consistency_score": round(self.consistency_score, 2),
            "severity": severity,
            "details": {
                "sentiment_score": sentiment_score,
                "overall_rating": overall_rating,
                "text_word_count": text_word_count,
                "recommendation": self._get_recommendation(passed, severity),
            },
        }

    def _check_sentiment_rating_consistency(
        self, sentiment_score: float, rating: int, label: str
    ) -> None:
        """
        Core bias check: Compare sentiment (-1 to 1) with rating (1-10)
        
        Logic:
        - Normalize both to 0-1 scale
        - Calculate difference
        - Flag if difference is too large
        """
        # Normalize rating to 0-1 (1 = 0.0, 10 = 1.0)
        normalized_rating = (rating - 1) / 9

        # Normalize sentiment to 0-1 (-1 = 0.0, 1 = 1.0)
        normalized_sentiment = (sentiment_score + 1) / 2

        # Calculate inconsistency
        inconsistency = abs(normalized_rating - normalized_sentiment)

        # Logic:
        # If rating says "Good" (8/10 = 0.78) but sentiment is "Negative" (-0.8 = 0.1),
        # that's a huge gap (0.68) > threshold (0.6) = RED FLAG
        if inconsistency > self.SENTIMENT_RATING_THRESHOLD:
            flag = {
                "type": "sentiment_rating_mismatch",
                "severity": "high",
                "message": f"Text sentiment ({label}) contradicts numeric rating ({rating}/10)",
                "inconsistency_score": round(inconsistency, 2),
            }
            self.bias_flags.append(flag)
            self.consistency_score -= 0.25

    def _check_text_extremism(
        self, word_count: int, rating: int, sentiment: float
    ) -> None:
        """
        Detect very short feedback with extreme ratings
        
        Example: "Bad student" (2 words) with rating 1/10 = Suspicious!
        Could indicate rushed or unfair evaluation.
        """
        is_extreme_rating = rating <= 2 or rating >= 9
        is_short_text = word_count < self.MIN_TEXT_LENGTH_FOR_ANALYSIS

        if is_extreme_rating and is_short_text:
            flag = {
                "type": "insufficient_justification",
                "severity": "medium",
                "message": f"Extreme rating ({rating}/10) with minimal feedback ({word_count} words). "
                + "Provide more detailed justification.",
                "word_count": word_count,
            }
            self.bias_flags.append(flag)
            self.consistency_score -= 0.15

    def _check_rating_variance(self, ratings: dict) -> None:
        """
        Detect huge variance across different skill ratings
        
        Example: 9/10 in technical, 1/10 in communication = Red Flag
        Could indicate evaluator is focusing on one aspect unfairly.
        """
        values = [
            ratings.get("rating_technical", 5),
            ratings.get("rating_communication", 5),
            ratings.get("rating_work_ethic", 5),
        ]

        if len([v for v in values if v]) > 0:
            variance = max(values) - min(values)

            # If spread is more than 6 points (e.g., 2 and 8), that's suspicious
            if variance >= 6:
                flag = {
                    "type": "extreme_rating_variance",
                    "severity": "medium",
                    "message": f"Large variance in ratings detected (Highest: {max(values)}, Lowest: {min(values)}). "
                    + "Ensure all areas are evaluated fairly.",
                    "variance": variance,
                }
                self.bias_flags.append(flag)
                self.consistency_score -= 0.10

    def _check_keyword_rating_alignment(self, sentiment_label: str, rating: int) -> None:
        """
        Additional check: Ensure sentiment label aligns with rating zone
        
        Zones:
        - Rating 1-3: "Negative" sentiment expected
        - Rating 4-6: "Neutral" sentiment expected
        - Rating 7-10: "Positive" sentiment expected
        """
        expected_labels = {
            "negative": [1, 2, 3],
            "neutral": [4, 5, 6],
            "positive": [7, 8, 9, 10],
        }

        if rating in expected_labels.get("negative", []) and sentiment_label != "negative":
            self.bias_flags.append(
                {
                    "type": "subtle_bias",
                    "severity": "low",
                    "message": "Low rating but positive/neutral tone detected. "
                    + "Ensure feedback reflects the rating.",
                }
            )
            self.consistency_score -= 0.05

        elif rating in expected_labels.get("positive", []) and sentiment_label == "negative":
            self.bias_flags.append(
                {
                    "type": "subtle_bias",
                    "severity": "low",
                    "message": "High rating but negative tone detected. "
                    + "Ensure feedback is balanced and reflects the rating.",
                }
            )
            self.consistency_score -= 0.05

    def _get_average_rating(self, ratings: dict) -> float:
        """Calculate average of all ratings"""
        valid_ratings = [
            v
            for v in [
                ratings.get("rating_technical"),
                ratings.get("rating_communication"),
                ratings.get("rating_work_ethic"),
                ratings.get("rating_overall"),
            ]
            if v is not None
        ]
        return sum(valid_ratings) / len(valid_ratings) if valid_ratings else 5

    def _calculate_consistency_score(self) -> None:
        """Update consistency score based on flags"""
        # Consistency score starts at 1.0, gets reduced by flag severity
        # Already modified in individual check methods
        self.consistency_score = max(0.0, self.consistency_score)

    def _determine_severity(self) -> str:
        """Determine overall severity of bias"""
        if not self.bias_flags:
            return "none"

        has_high = any(f.get("severity") == "high" for f in self.bias_flags)
        has_medium = any(f.get("severity") == "medium" for f in self.bias_flags)

        if has_high:
            return "high"
        elif has_medium:
            return "medium"
        else:
            return "low"

    def _get_recommendation(self, passed: bool, severity: str) -> str:
        """Generate actionable recommendation"""
        if passed:
            return "✅ Evaluation passed bias check. Ready for submission."

        if severity == "high":
            return "⛔ HIGH BIAS DETECTED: Please revise feedback to ensure consistency between text and ratings."

        if severity == "medium":
            return "⚠️ MEDIUM BIAS: Review your evaluation for potential inconsistencies."

        return "ℹ️ Minor inconsistencies detected. Consider reviewing for clarity."
