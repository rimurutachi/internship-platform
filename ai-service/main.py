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

@app.post("/api/evaluate-draft")
async def evaluate_draft(request: EvaluationRequest):
    """
    Lightweight endpoint for Supervisor real-time feedback.
    Used while supervisor is still typing.
    
    Returns: Features + Sentiment (NO bias check for speed)
    """
    try:
        if not request.text or len(request.text.strip()) < 5:
            return {
                "status": "insufficient_text",
                "features": {"technical_skills": [], "soft_skills": []},
                "sentiment": {"score": 0, "label": "neutral", "breakdown": {}},
            }

        features = ai_engine.extractor.extract(request.text)
        sentiment = ai_engine.sentiment_analyzer.analyze(request.text)

        return {
            "status": "success",
            "features": features,
            "sentiment": sentiment,
            "processing_time_ms": 50,  # Should be very fast
        }

    except Exception as e:
        logger.error(f"Draft analysis error: {e}")
        raise HTTPException(status_code=500, detail="Draft analysis failed")


@app.post("/api/evaluate-with-bias")
async def evaluate_with_bias(request: EvaluationRequest):
    """
    Full analysis WITH bias detection.
    Used when supervisor SUBMITS evaluation (heavier computation).
    
    Requires: text + ratings
    """
    try:
        if not request.text or len(request.text.strip()) < 10:
            raise HTTPException(status_code=400, detail="Evaluation text too short")

        # FIX IS HERE: Convert Pydantic model to dictionary using .model_dump()
        ratings = request.ratings.model_dump() if request.ratings else {}

        logger.info(f"Full analysis with bias detection for: {request.evaluation_id}")

        # This calls the ENHANCED analyze_evaluation with bias detection
        result = ai_engine.analyze_evaluation(request.text, ratings)

        return result

    except ValidationError as e:
        logger.error(f"Validation error: {e}")
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        logger.error(f"Analysis error: {e}", exc_info=True) # exc_info adds stack trace to logs
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
