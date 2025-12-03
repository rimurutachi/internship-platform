# ai-service/models/schemas.py
from pydantic import BaseModel
from typing import Optional


class EvaluationRequest(BaseModel):
    """Request schema for evaluation analysis"""

    text: str
    internship_id: Optional[str] = None
    evaluation_id: Optional[str] = None

    class Config:
        json_schema_extra = {
            "example": {
                "text": "The student demonstrated excellent problem solving skills in React and Node.js. Great communication with the team.",
                "internship_id": "550e8400-e29b-41d4-a716-446655440000",
            }
        }


class FeatureResponse(BaseModel):
    """Feature extraction response"""

    technical_skills: list
    soft_skills: list


class SentimentResponse(BaseModel):
    """Sentiment analysis response"""

    score: float
    label: str
    breakdown: dict


class BiasCheckResponse(BaseModel):
    """Bias check response"""

    passed: bool
    flags: list


class AIAnalysisResponse(BaseModel):
    """Complete AI analysis response"""

    features: FeatureResponse
    sentiment: SentimentResponse
    bias_check: BiasCheckResponse
    confidence_score: float
    processing_time_ms: float

# Add to models/schemas.py

class RatingsRequest(BaseModel):
    """Ratings sub-model"""
    rating_overall: int = None
    rating_technical: int = None
    rating_communication: int = None
    rating_work_ethic: int = None

    class Config:
        json_schema_extra = {
            "example": {
                "rating_overall": 8,
                "rating_technical": 9,
                "rating_communication": 7,
                "rating_work_ethic": 8
            }
        }


# Update EvaluationRequest
class EvaluationRequest(BaseModel):
    """Request schema for evaluation analysis"""
    text: str
    internship_id: Optional[str] = None
    evaluation_id: Optional[str] = None
    ratings: Optional[RatingsRequest] = None  # ADD THIS

    class Config:
        json_schema_extra = {
            "example": {
                "text": "Student showed great problem solving...",
                "evaluation_id": "test-123",
                "ratings": {
                    "rating_overall": 8,
                    "rating_technical": 9,
                    "rating_communication": 7,
                    "rating_work_ethic": 8
                }
            }
        }
