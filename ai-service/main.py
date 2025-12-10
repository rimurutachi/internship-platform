# main.py
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import ValidationError
import uvicorn
import os
import logging
from dotenv import load_dotenv

# Import our new modules (Ensure folders 'models' and 'services' exist)
from models.schemas import EvaluationRequest, AIAnalysisResponse
from services.ai_engine import AIEngine

# Load env vars
load_dotenv()

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize AI Engine
ai_engine = AIEngine()

# Create FastAPI app
app = FastAPI(
    title="Intern-Galing AI Service",
    description="LLT + Sentiment Analysis for Internship Evaluations.",
    version="1.0.0"
)

# Cors configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Routes ---

@app.get('/')
async def root():
    """Root endpoint for service status"""
    return {
        "message": "Intern-Galing AI Service",
        "status": "running",
        "version": "1.0.0",
        "service": "ai-service"
    }

@app.get("/health")
async def health_check():
    """Real health check of AI components"""
    # Instead of static "OK", we check if the engine is initialized
    health_status = ai_engine.get_health_status()
    return {
        "service": "Intern-Galing AI",
        **health_status
    }

# Real implementation of the evaluation endpoint
@app.post("/api/evaluate", response_model=AIAnalysisResponse)
async def evaluate_feedback(request: EvaluationRequest):
    """
    Analyzes internship feedback using LLT (Linear Law-based Transformation)
    and Sentiment Analysis.
    """
    try:
        # Input Validation
        if not request.text or len(request.text.strip()) == 0:
            raise HTTPException(status_code=400, detail="Evaluation text cannot be empty")
        
        if len(request.text) < 10:
             raise HTTPException(status_code=400, detail="Text is too short for meaningful analysis (min 10 chars)")

        logger.info(f"Processing evaluation for: {request.evaluation_id or 'New Request'}")

        # --- THE AI MAGIC HAPPENS HERE ---
        result = ai_engine.analyze_evaluation(request.text)
        
        return result

    except ValidationError as e:
        logger.error(f"Validation Error: {e}")
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        logger.error(f"Internal Error: {e}")
        raise HTTPException(status_code=500, detail="Internal server error during analysis")

@app.post("/api/evaluate-post-approval")
async def evaluate_post_approval(evaluations: list[dict]):
    """
    Analytics-only endpoint for generating insights from HISTORICAL evaluations.
    
    This endpoint is called AFTER advisor approval to generate insights, trends,
    and recommendations based on approved evaluations. It does NOT assist in
    drafting or creating new evaluations.
    
    Args:
        evaluations: List of approved evaluation objects with:
            - evaluation_id: str
            - text: str (comments/feedback)
            - ratings: dict (performance ratings)
            - student_id: str
            - supervisor_id: str
            - created_at: str
            - final_grade: float
    
    Returns:
        Top 3 insights/trends for dashboard display
    """
    try:
        if not evaluations or len(evaluations) == 0:
            raise HTTPException(status_code=400, detail="No evaluations provided for analysis")

        logger.info(f"Analyzing {len(evaluations)} approved evaluations for insights")

        # Aggregate sentiment across all evaluations
        sentiment_scores = []
        all_features = {"technical_skills": [], "soft_skills": []}
        grade_distribution = []
        
        for eval_data in evaluations:
            text = eval_data.get('text', '')
            if text and len(text.strip()) >= 10:
                # Extract sentiment
                sentiment = ai_engine.enhanced_sentiment.analyze(text)
                sentiment_scores.append(sentiment.get('score', 0))
                
                # Extract features
                features = ai_engine.extractor.extract(text)
                all_features['technical_skills'].extend(features.get('technical_skills', []))
                all_features['soft_skills'].extend(features.get('soft_skills', []))
            
            # Collect grades
            if 'final_grade' in eval_data:
                grade_distribution.append(eval_data['final_grade'])

        # Calculate insights
        insights = []
        
        # Insight 1: Overall Sentiment Trend
        if sentiment_scores:
            avg_sentiment = sum(sentiment_scores) / len(sentiment_scores)
            sentiment_label = "positive" if avg_sentiment > 0.3 else "neutral" if avg_sentiment > -0.3 else "negative"
            insights.append({
                "type": "sentiment_trend",
                "title": f"Overall Sentiment: {sentiment_label.capitalize()}",
                "description": f"Average sentiment score across {len(evaluations)} evaluations is {avg_sentiment:.2f}",
                "score": avg_sentiment,
                "category": "sentiment"
            })
        
        # Insight 2: Top Skills Mentioned
        if all_features['technical_skills'] or all_features['soft_skills']:
            from collections import Counter
            all_skills = all_features['technical_skills'] + all_features['soft_skills']
            skill_counts = Counter(all_skills)
            top_skills = skill_counts.most_common(3)
            
            if top_skills:
                skills_text = ", ".join([f"{skill} ({count}x)" for skill, count in top_skills])
                insights.append({
                    "type": "skill_analysis",
                    "title": "Most Recognized Skills",
                    "description": f"Top skills mentioned: {skills_text}",
                    "skills": [{"name": s, "count": c} for s, c in top_skills],
                    "category": "skills"
                })
        
        # Insight 3: Grade Distribution Analysis
        if grade_distribution:
            avg_grade = sum(grade_distribution) / len(grade_distribution)
            high_performers = len([g for g in grade_distribution if g <= 2.0])  # 1.0-2.0 is excellent
            insights.append({
                "type": "grade_distribution",
                "title": "Performance Overview",
                "description": f"Average grade: {avg_grade:.2f}, High performers: {high_performers}/{len(grade_distribution)} students",
                "average_grade": avg_grade,
                "high_performers": high_performers,
                "total_students": len(grade_distribution),
                "category": "performance"
            })

        # Return top 3 insights
        return {
            "status": "success",
            "total_evaluations_analyzed": len(evaluations),
            "insights": insights[:3],  # Top 3 insights
            "generated_at": "2025-12-08T00:00:00Z"
        }

    except Exception as e:
        logger.error(f"Post-approval analysis error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Analytics generation failed")


@app.post("/api/evaluate-with-bias")
async def evaluate_with_bias(request: EvaluationRequest):
    """
    Full Phase 1 Enhanced Analysis WITH bias detection.
    Used when supervisor SUBMITS evaluation (comprehensive computation).
    
    Phase 1 Features:
    - Enhanced sentiment analysis
    - LLT rating guidance
    - Feedback quality assessment
    - Comprehensive bias detection
    
    Requires: text + ratings (recommended)
    """
    try:
        if not request.text or len(request.text.strip()) < 10:
            raise HTTPException(status_code=400, detail="Evaluation text too short")

        # Convert ratings to dictionary
        ratings = request.ratings.model_dump() if request.ratings else {}

        logger.info(f"Phase 1 Enhanced analysis for: {request.evaluation_id}")

        # Full Phase 1 analysis with all enhancements
        result = ai_engine.analyze_evaluation(
            text=request.text, 
            ratings=ratings,
            use_enhanced=True  # Use Phase 1 enhanced features
        )

        return result

    except ValidationError as e:
        logger.error(f"Validation error: {e}")
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        logger.error(f"Analysis error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Analysis failed due to an internal error")


@app.post("/api/batch-evaluate")
async def batch_evaluate(requests: list[EvaluationRequest]):
    """
    Batch processing for admin dashboard reports
    """
    results = []
    for req in requests:
        try:
            analysis = ai_engine.analyze_evaluation(req.text)
            results.append({
                "evaluation_id": req.evaluation_id,
                "status": "success",
                "data": analysis
            })
        except Exception as e:
            results.append({
                "evaluation_id": req.evaluation_id,
                "status": "error",
                "error": str(e)
            })
    return {"total": len(requests), "results": results}

# Run Server
if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=port,
        reload=True
    )
