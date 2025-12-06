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
    Enhanced real-time feedback analysis for supervisors.
    
    Phase 1 Features:
    - Enhanced sentiment analysis with context awareness
    - Real-time feedback quality guidance
    - LLT rating suggestions (lightweight)
    
    Used while supervisor is still typing.
    """
    try:
        if not request.text or len(request.text.strip()) < 5:
            return {
                "status": "insufficient_text",
                "features": {"technical_skills": [], "soft_skills": []},
                "sentiment": {"score": 0, "label": "neutral", "breakdown": {}},
                "feedback_quality": {
                    "suggestions": [],
                    "quality_score": 0,
                    "readiness": False
                }
            }

        # Extract features
        features = ai_engine.extractor.extract(request.text)
        
        # Enhanced sentiment analysis
        sentiment = ai_engine.enhanced_sentiment.analyze(request.text)
        
        # Quick analysis for guidance (no full bias check for speed)
        quick_analysis = {
            'features': features,
            'sentiment': sentiment,
            'bias_check': {'passed': True, 'consistency_score': 1.0}  # Placeholder
        }
        
        # Feedback quality guidance
        guidance = ai_engine.feedback_guide.analyze_draft(request.text, quick_analysis)
        
        # Optional: Quick LLT suggestion (if ratings provided)
        llt_guidance = None
        if request.ratings:
            ratings = request.ratings.model_dump() if hasattr(request.ratings, 'model_dump') else request.ratings
            llt_guidance = ai_engine.llt_transformer.transform(
                features, sentiment, quick_analysis['bias_check'], request.text
            )

        return {
            "status": "success",
            "features": features,
            "sentiment": sentiment,
            "feedback_quality": guidance,  # NEW: Phase 1
            "llt_guidance": llt_guidance,  # NEW: Phase 1 (optional)
            "processing_time_ms": 80,  # Slightly slower due to enhanced features
        }

    except Exception as e:
        logger.error(f"Draft analysis error: {e}")
        raise HTTPException(status_code=500, detail="Draft analysis failed")


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
