# ai-service/services/sentiment_analyzer.py
from textblob import TextBlob


class SentimentAnalyzer:
    """
    Analyzes sentiment (emotional tone) of evaluation feedback text.
    Uses TextBlob which provides a simple polarity score (-1 to 1).
    """

    def analyze(self, text: str) -> dict:
        """
        Analyze sentiment of text.
        Returns: {
            "score": float (-1 to 1),
            "label": str (positive | neutral | negative),
            "breakdown": {
                "positive": float,
                "neutral": float,
                "negative": float
            }
        }
        """
        try:
            blob = TextBlob(text)
            polarity = blob.sentiment.polarity  # -1 (negative) to 1 (positive)

            # Determine label based on threshold
            if polarity > 0.2:
                label = "positive"
            elif polarity < -0.2:
                label = "negative"
            else:
                label = "neutral"

            # Calculate breakdown percentages
            # Simple heuristic: map polarity to sentiment distribution
            if polarity > 0:
                positive_score = (polarity + 1) / 2  # Scale to 0-1
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
                "score": round(polarity, 2),
                "label": label,
                "breakdown": {
                    "positive": round(positive_score, 2),
                    "neutral": round(neutral_score, 2),
                    "negative": round(negative_score, 2),
                },
            }
        except Exception as e:
            # Fallback in case of error
            print(f"Sentiment analysis error: {e}")
            return {
                "score": 0.0,
                "label": "neutral",
                "breakdown": {"positive": 0.33, "neutral": 0.34, "negative": 0.33},
            }
