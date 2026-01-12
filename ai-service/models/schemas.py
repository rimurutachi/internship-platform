# ai-service/models/schemas.py
"""
Pydantic schemas for AI Trend Analysis Service
Aligned with database schema: evaluations, evaluation_criterion_scores, internships, companies, universities

Version: 2.0.0 - Historical Trend Analysis
Purpose: Decision support for admin based on approved evaluation data
"""
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


# =============================================================================
# INPUT SCHEMAS - Aligned with Database Structure
# =============================================================================

class CriterionScore(BaseModel):
    """Individual criterion score from evaluation_criterion_scores table"""
    criterion_code: str
    criterion_name: str
    score: int = Field(..., ge=1, le=10, description="Score from 1-10")


class EvaluationData(BaseModel):
    """
    Single evaluation data for trend analysis.
    Aligned with: evaluations, evaluation_criterion_scores, internships, companies, universities tables
    """
    # Evaluation identifiers
    evaluation_id: str
    internship_id: str
    student_id: str
    supervisor_id: str
    advisor_id: Optional[str] = None
    
    # Company context (from internships JOIN companies)
    company_id: str
    company_name: str
    
    # University context (from users JOIN universities)
    university_id: str
    university_name: str
    
    # Position/Department (from internships)
    position: str
    department: Optional[str] = None
    
    # Evaluation content - aligned with actual schema
    supervisor_comments: str = Field(..., min_length=10, description="Main feedback text for analysis")
    total_score: Optional[float] = Field(None, description="Rubric-based total score")
    final_grade: Optional[float] = Field(None, ge=1.0, le=5.0, description="CvSU grade scale 1.0-5.0")
    attendance: Optional[str] = Field(None, pattern="^(regular|irregular)$")
    punctuality: Optional[str] = Field(None, pattern="^(regular|irregular)$")
    
    # Rubric-based criterion scores (from evaluation_criterion_scores table)
    criterion_scores: Optional[List[CriterionScore]] = []
    
    # Timestamps for time-series analysis
    approved_at: str = Field(..., description="ISO timestamp when evaluation was approved")
    submitted_at: Optional[str] = None
    
    class Config:
        json_schema_extra = {
            "example": {
                "evaluation_id": "550e8400-e29b-41d4-a716-446655440001",
                "internship_id": "550e8400-e29b-41d4-a716-446655440002",
                "student_id": "550e8400-e29b-41d4-a716-446655440003",
                "supervisor_id": "550e8400-e29b-41d4-a716-446655440004",
                "company_id": "550e8400-e29b-41d4-a716-446655440005",
                "company_name": "Tech Solutions Inc.",
                "university_id": "550e8400-e29b-41d4-a716-446655440006",
                "university_name": "Cavite State University",
                "position": "Software Developer Intern",
                "supervisor_comments": "The student demonstrated excellent problem solving skills in React and Node.js. Great communication with the team. Could improve on time management.",
                "total_score": 85.5,
                "final_grade": 1.5,
                "attendance": "regular",
                "punctuality": "regular",
                "criterion_scores": [
                    {"criterion_code": "TECH", "criterion_name": "Technical Skills", "score": 9},
                    {"criterion_code": "COMM", "criterion_name": "Communication", "score": 8},
                    {"criterion_code": "WORK", "criterion_name": "Work Ethic", "score": 8}
                ],
                "approved_at": "2026-01-10T10:30:00Z"
            }
        }


class TrendAnalysisRequest(BaseModel):
    """
    Request for comprehensive trend analysis.
    Accepts array of approved evaluations with full context.
    """
    evaluations: List[EvaluationData] = Field(..., min_length=1, description="List of approved evaluations to analyze")
    
    # Optional filters for analysis scope
    date_range_start: Optional[str] = Field(None, description="ISO date for analysis start")
    date_range_end: Optional[str] = Field(None, description="ISO date for analysis end")
    
    # Analysis options
    include_recommendations: bool = Field(True, description="Include decision support recommendations")
    top_n_skills: int = Field(10, ge=1, le=50, description="Number of top skills to return")
    top_n_companies: int = Field(10, ge=1, le=50, description="Number of top companies to analyze")
    
    class Config:
        json_schema_extra = {
            "example": {
                "evaluations": [],  # Array of EvaluationData
                "include_recommendations": True,
                "top_n_skills": 10,
                "top_n_companies": 10
            }
        }


# =============================================================================
# OUTPUT SCHEMAS - Trend Analysis Results
# =============================================================================

class SkillFrequency(BaseModel):
    """Skill with frequency count"""
    name: str
    count: int
    percentage: float = Field(..., description="Percentage of evaluations mentioning this skill")
    category: str = Field(..., pattern="^(technical|soft)$")


class CompanyPerformance(BaseModel):
    """Performance statistics for a company"""
    company_id: str
    company_name: str
    total_evaluations: int
    average_score: float
    average_grade: float
    sentiment_score: float
    sentiment_label: str = Field(..., pattern="^(positive|neutral|negative)$")
    top_skills: List[str] = Field(default_factory=list, description="Most mentioned skills at this company")
    performance_rating: str = Field(..., pattern="^(excellent|good|average|below_average|poor)$")


class UniversityPerformance(BaseModel):
    """Performance statistics for a university"""
    university_id: str
    university_name: str
    total_evaluations: int
    total_students: int
    average_score: float
    average_grade: float
    sentiment_score: float
    top_companies: List[str] = Field(default_factory=list, description="Companies where this university excels")
    weak_companies: List[str] = Field(default_factory=list, description="Companies where performance is low")


class SentimentTrend(BaseModel):
    """Sentiment aggregation over a time period"""
    period: str = Field(..., description="Time period (e.g., '2026-01', 'Q1-2026')")
    average_score: float
    label: str = Field(..., pattern="^(positive|neutral|negative)$")
    evaluation_count: int
    positive_percentage: float
    neutral_percentage: float
    negative_percentage: float


class SkillTrends(BaseModel):
    """Skill analysis results"""
    technical_skills: List[SkillFrequency]
    soft_skills: List[SkillFrequency]
    total_unique_skills: int
    most_demanded_overall: List[SkillFrequency]


class Recommendation(BaseModel):
    """AI-generated decision support recommendation"""
    type: str = Field(..., description="recommendation | warning | insight")
    priority: str = Field(..., pattern="^(high|medium|low)$")
    title: str
    description: str
    affected_entity: Optional[str] = Field(None, description="Company/University/Position name")
    supporting_data: Optional[dict] = Field(default_factory=dict)


class Insight(BaseModel):
    """Single insight from trend analysis"""
    type: str = Field(..., description="sentiment_trend | skill_analysis | performance | comparison")
    category: str
    title: str
    description: str
    data: Optional[dict] = Field(default_factory=dict)


class AnalysisPeriod(BaseModel):
    """Time period covered by analysis"""
    start_date: str
    end_date: str
    total_months: int


class TrendAnalysisResponse(BaseModel):
    """
    Complete trend analysis response with decision support.
    Main output for admin dashboard and evaluations page.
    """
    status: str = Field(..., pattern="^(success|partial|error)$")
    total_evaluations_analyzed: int
    analysis_period: AnalysisPeriod
    
    # Summary insights (for dashboard cards)
    insights: List[Insight] = Field(default_factory=list, description="Top insights for quick view")
    
    # Detailed analysis sections
    company_performance: List[CompanyPerformance] = Field(default_factory=list)
    university_performance: List[UniversityPerformance] = Field(default_factory=list)
    skill_trends: Optional[SkillTrends] = None
    sentiment_trends: List[SentimentTrend] = Field(default_factory=list, description="Monthly/quarterly sentiment")
    
    # Decision support
    recommendations: List[Recommendation] = Field(default_factory=list, description="AI recommendations for admin")
    
    # Metadata
    generated_at: str
    processing_time_ms: float
    ai_version: str = "2.0.0-trends"
    
    class Config:
        json_schema_extra = {
            "example": {
                "status": "success",
                "total_evaluations_analyzed": 150,
                "analysis_period": {
                    "start_date": "2025-07-01",
                    "end_date": "2026-01-12",
                    "total_months": 6
                },
                "insights": [
                    {
                        "type": "comparison",
                        "category": "performance",
                        "title": "CvSU excels at Tech Solutions Inc.",
                        "description": "Students from Cavite State University average 8.5/10 at Tech Solutions, 40% above platform average."
                    }
                ],
                "recommendations": [
                    {
                        "type": "warning",
                        "priority": "high",
                        "title": "Avoid Company XYZ for CvSU students",
                        "description": "Historical data shows CvSU students average only 5.2/10 at Company XYZ. Consider alternative placements.",
                        "affected_entity": "Company XYZ"
                    }
                ]
            }
        }


# =============================================================================
# SIMPLE ENDPOINT SCHEMAS (For dashboard summary)
# =============================================================================

class DashboardInsightRequest(BaseModel):
    """Lightweight request for dashboard summary insights"""
    evaluations: List[EvaluationData]
    max_insights: int = Field(5, ge=1, le=10, description="Maximum number of insights to return")


class DashboardInsightResponse(BaseModel):
    """Lightweight response for dashboard cards"""
    status: str
    total_evaluations: int
    insights: List[Insight]
    quick_stats: dict = Field(default_factory=dict)
    generated_at: str


# =============================================================================
# HEALTH CHECK SCHEMA
# =============================================================================

class HealthResponse(BaseModel):
    """Health check response"""
    service: str
    status: str
    version: str
    components: dict
    capabilities: List[str]
