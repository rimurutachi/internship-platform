# main.py
"""
Intern-Galing AI Service - Trend Analysis API
Version: 2.0.0

Purpose: Analyze historical evaluation data to provide decision support for internship placements.

Endpoints:
- POST /api/analyze-trends - Comprehensive trend analysis
- POST /api/dashboard-insights - Quick insights for admin dashboard
- POST /api/company-performance - Company performance ranking
- POST /api/university-performance - University comparison
- POST /api/university-company-matrix - Cross-tabulation analysis
- POST /api/skill-analysis - Skill demand trends
- GET /health - Service health check
"""
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from pydantic import ValidationError
import uvicorn
import os
import logging
import time
from dotenv import load_dotenv

# Import schemas and engine
from models.schemas import (
    TrendAnalysisRequest,
    TrendAnalysisResponse,
    DashboardInsightRequest,
    DashboardInsightResponse,
    HealthResponse
)
from services.ai_engine import AIEngine

# Load env vars
load_dotenv()

# Setup logging with detailed format
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# =============================================================================
# SECURITY: Rate Limiting Configuration (OWASP Best Practice)
# =============================================================================

"""
Rate limit configuration via environment variables:
- RATE_LIMIT_ENABLED: Feature flag to disable rate limiting (default: true)
- RATE_LIMIT_REQUESTS_PER_MINUTE: Max requests per minute per IP (default: 10)
- RATE_LIMIT_ANALYSIS_PER_MINUTE: Max analysis requests per minute (default: 5)
"""
RATE_LIMIT_ENABLED = os.getenv("RATE_LIMIT_ENABLED", "true").lower() == "true"
RATE_LIMIT_DEFAULT = os.getenv("RATE_LIMIT_REQUESTS_PER_MINUTE", "10") + "/minute"
RATE_LIMIT_ANALYSIS = os.getenv("RATE_LIMIT_ANALYSIS_PER_MINUTE", "5") + "/minute"

# Initialize rate limiter
limiter = Limiter(
    key_func=get_remote_address,
    enabled=RATE_LIMIT_ENABLED,
    default_limits=[RATE_LIMIT_DEFAULT]
)

logger.info(f"🔒 Rate Limiting: enabled={RATE_LIMIT_ENABLED}, default={RATE_LIMIT_DEFAULT}, analysis={RATE_LIMIT_ANALYSIS}")

# Initialize AI Engine
logger.info("🚀 Starting Intern-Galing AI Service v2.0.0 - Trend Analysis")
ai_engine = AIEngine()

# Create FastAPI app
app = FastAPI(
    title="Intern-Galing AI Service",
    description="Historical Trend Analysis for Internship Evaluations - Decision Support System",
    version="2.0.0"
)

# Attach rate limiter to app
app.state.limiter = limiter

# Custom rate limit exceeded handler with logging
@app.exception_handler(RateLimitExceeded)
async def rate_limit_handler(request: Request, exc: RateLimitExceeded):
    client_ip = get_remote_address(request)
    logger.warning(f"⚠️ RATE LIMIT: IP {client_ip} exceeded limit on {request.method} {request.url.path}")
    return JSONResponse(
        status_code=429,
        content={
            "success": False,
            "error": "Too many requests",
            "message": "Rate limit exceeded. Please wait before making more requests.",
            "retry_after": 60  # seconds
        },
        headers={"Retry-After": "60"}
    )

# =============================================================================
# SECURITY: CORS Configuration (Restricted to Backend Only)
# =============================================================================

# Get allowed origins from environment (comma-separated)
ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "").split(",") if os.getenv("ALLOWED_ORIGINS") else []
BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:5000")

# Always include backend URL
if BACKEND_URL not in ALLOWED_ORIGINS:
    ALLOWED_ORIGINS.append(BACKEND_URL)

# In development, also allow localhost frontend for testing
if os.getenv("NODE_ENV") != "production":
    dev_origins = ["http://localhost:3000", "http://localhost:5000", "http://127.0.0.1:3000", "http://127.0.0.1:5000"]
    for origin in dev_origins:
        if origin not in ALLOWED_ORIGINS:
            ALLOWED_ORIGINS.append(origin)

# Remove empty strings
ALLOWED_ORIGINS = [o for o in ALLOWED_ORIGINS if o]

logger.info(f"🌐 CORS Allowed Origins: {ALLOWED_ORIGINS}")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,  # SECURITY: Restricted to specific origins
    allow_credentials=True,
    allow_methods=["GET", "POST"],  # SECURITY: Only methods we need
    allow_headers=["Authorization", "Content-Type"],  # SECURITY: Only headers we need
)


# =============================================================================
# ROOT & HEALTH ENDPOINTS
# =============================================================================

@app.get('/')
async def root():
    """Root endpoint for service status"""
    logger.info("📍 Root endpoint accessed")
    return {
        "message": "Intern-Galing AI Service - Trend Analysis",
        "status": "running",
        "version": "2.0.0",
        "service": "ai-service",
        "purpose": "Historical evaluation trend analysis for decision support"
    }


@app.get("/health", response_model=HealthResponse)
async def health_check():
    """
    Health check endpoint.
    Returns status of all AI components.
    """
    logger.info("💓 Health check requested")
    health_status = ai_engine.get_health_status()
    return {
        "service": "Intern-Galing AI - Trend Analysis",
        **health_status
    }


# =============================================================================
# MAIN TREND ANALYSIS ENDPOINTS
# =============================================================================

@app.post("/api/analyze-trends")
@limiter.limit(RATE_LIMIT_ANALYSIS)  # SECURITY: Stricter limit for CPU-intensive analysis
async def analyze_trends(request: Request, data: TrendAnalysisRequest):
    """
    Comprehensive trend analysis endpoint.
    
    Analyzes historical evaluation data to generate:
    - Company performance rankings
    - University performance comparisons
    - Skill demand trends
    - Sentiment trends over time
    - Decision support recommendations
    
    Request body:
        - evaluations: List of approved evaluation data with full context
        - include_recommendations: bool (default: True)
        - top_n_skills: int (default: 10)
        - top_n_companies: int (default: 10)
    
    Returns:
        Complete TrendAnalysisResponse with all analysis components
    """
    try:
        eval_count = len(data.evaluations)
        logger.info(f"🔵 POST /api/analyze-trends - Analyzing {eval_count} evaluations")
        
        if eval_count == 0:
            logger.warning("⚠️ No evaluations provided for analysis")
            raise HTTPException(status_code=400, detail="No evaluations provided for analysis")
        
        # Convert Pydantic models to dicts for processing
        evaluations = [e.model_dump() for e in data.evaluations]
        
        # Build options from request
        options = {
            'include_recommendations': data.include_recommendations,
            'top_n_skills': data.top_n_skills,
            'top_n_companies': data.top_n_companies,
            'include_detailed_analysis': True  # Always include for full endpoint
        }
        
        # Run analysis
        result = ai_engine.analyze_trends(evaluations, options)
        
        logger.info(f"✅ Trend analysis complete: {len(result.get('insights', []))} insights, {len(result.get('recommendations', []))} recommendations")
        
        return result
        
    except ValidationError as e:
        logger.error(f"❌ Validation error: {e}")
        raise HTTPException(status_code=422, detail=str(e))
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Trend analysis error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Internal server error during trend analysis")


@app.post("/api/dashboard-insights")
@limiter.limit(RATE_LIMIT_DEFAULT)  # SECURITY: Rate limited
async def get_dashboard_insights(request: Request, data: DashboardInsightRequest):
    """
    Quick insights for admin dashboard.
    Lighter-weight analysis optimized for dashboard cards.
    
    Request body:
        - evaluations: List of approved evaluation data
        - max_insights: int (default: 5, max: 10)
    
    Returns:
        Quick insights with summary statistics
    """
    try:
        eval_count = len(data.evaluations)
        logger.info(f"🔵 POST /api/dashboard-insights - Processing {eval_count} evaluations")
        
        if eval_count == 0:
            logger.warning("⚠️ No evaluations provided")
            return {
                'status': 'success',
                'total_evaluations': 0,
                'insights': [],
                'quick_stats': {
                    'total_evaluations': 0,
                    'unique_companies': 0,
                    'unique_universities': 0,
                    'average_grade': 0,
                    'positive_sentiment_rate': 0
                },
                'generated_at': time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime())
            }
        
        # Convert to dicts
        evaluations = [e.model_dump() for e in data.evaluations]
        
        # Get dashboard insights
        result = ai_engine.get_dashboard_insights(evaluations, data.max_insights)
        
        logger.info(f"✅ Dashboard insights generated: {len(result.get('insights', []))} insights")
        
        return result
        
    except ValidationError as e:
        logger.error(f"❌ Validation error: {e}")
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        logger.error(f"❌ Dashboard insights error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to generate dashboard insights")


# =============================================================================
# DETAILED ANALYSIS ENDPOINTS
# =============================================================================

@app.post("/api/company-performance")
@limiter.limit(RATE_LIMIT_ANALYSIS)  # SECURITY: Rate limited
async def analyze_company_performance(request: Request, data: TrendAnalysisRequest):
    """
    Detailed company performance analysis.
    
    Ranks companies by student performance with metrics like:
    - Average grade
    - Sentiment score
    - Performance rating
    - Top skills valued
    
    Query params (optional):
        - university_filter: Filter results by specific university_id
    
    Returns:
        Company rankings with detailed performance metrics
    """
    try:
        eval_count = len(data.evaluations)
        logger.info(f"🔵 POST /api/company-performance - Analyzing {eval_count} evaluations")
        
        if eval_count == 0:
            raise HTTPException(status_code=400, detail="No evaluations provided")
        
        evaluations = [e.model_dump() for e in data.evaluations]
        
        # Get company performance (no university filter in this version)
        result = ai_engine.analyze_company_performance(evaluations)
        
        logger.info(f"✅ Company analysis complete: {result.get('total_companies', 0)} companies ranked")
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Company analysis error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to analyze company performance")


@app.post("/api/university-performance")
@limiter.limit(RATE_LIMIT_ANALYSIS)  # SECURITY: Rate limited
async def analyze_university_performance(request: Request, data: TrendAnalysisRequest):
    """
    University performance comparison.
    
    Compares student performance across universities:
    - Rankings by average grade/score
    - Top and weak companies per university
    - Statistical summary
    
    Returns:
        University rankings with comparison insights
    """
    try:
        eval_count = len(data.evaluations)
        logger.info(f"🔵 POST /api/university-performance - Analyzing {eval_count} evaluations")
        
        if eval_count == 0:
            raise HTTPException(status_code=400, detail="No evaluations provided")
        
        evaluations = [e.model_dump() for e in data.evaluations]
        
        result = ai_engine.analyze_university_performance(evaluations)
        
        logger.info(f"✅ University analysis complete: {len(result.get('rankings', []))} universities compared")
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ University analysis error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to analyze university performance")


@app.post("/api/university-company-matrix")
@limiter.limit(RATE_LIMIT_ANALYSIS)  # SECURITY: Rate limited
async def get_university_company_matrix(request: Request, data: TrendAnalysisRequest):
    """
    University × Company performance matrix.
    
    Cross-tabulation showing how each university performs at each company.
    Key analysis for: "Where do CvSU students perform best?"
    
    Returns:
        Matrix with best and worst matches per university
    """
    try:
        eval_count = len(data.evaluations)
        logger.info(f"🔵 POST /api/university-company-matrix - Building matrix from {eval_count} evaluations")
        
        if eval_count == 0:
            raise HTTPException(status_code=400, detail="No evaluations provided")
        
        evaluations = [e.model_dump() for e in data.evaluations]
        
        result = ai_engine.get_university_company_matrix(evaluations)
        
        logger.info(f"✅ Matrix built: {len(result.get('best_matches', []))} best matches, {len(result.get('avoid_matches', []))} avoid matches")
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Matrix analysis error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to build university-company matrix")


@app.post("/api/skill-analysis")
@limiter.limit(RATE_LIMIT_ANALYSIS)  # SECURITY: Rate limited
async def analyze_skills(request: Request, data: TrendAnalysisRequest):
    """
    Skill demand analysis.
    
    Analyzes which skills are most valued across companies:
    - Skills by company
    - Skill trends over time (growing/declining)
    - Skill gap analysis
    - Training recommendations
    
    Returns:
        Comprehensive skill analysis with recommendations
    """
    try:
        eval_count = len(data.evaluations)
        logger.info(f"🔵 POST /api/skill-analysis - Analyzing skills from {eval_count} evaluations")
        
        if eval_count == 0:
            raise HTTPException(status_code=400, detail="No evaluations provided")
        
        evaluations = [e.model_dump() for e in data.evaluations]
        
        result = ai_engine.analyze_skill_demands(evaluations)
        
        logger.info(f"✅ Skill analysis complete")
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Skill analysis error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to analyze skills")


# =============================================================================
# LEGACY ENDPOINT (Backward compatibility - will be deprecated)
# =============================================================================

@app.post("/api/evaluate-post-approval")
@limiter.limit(RATE_LIMIT_DEFAULT)  # SECURITY: Rate limited
async def evaluate_post_approval_legacy(request: Request, evaluations: list[dict]):
    """
    LEGACY ENDPOINT - Maintained for backward compatibility.
    Use /api/dashboard-insights instead.
    
    Converts old format to new format and calls dashboard insights.
    """
    logger.warning("⚠️ Legacy endpoint /api/evaluate-post-approval called - consider migrating to /api/dashboard-insights")
    
    try:
        if not evaluations or len(evaluations) == 0:
            raise HTTPException(status_code=400, detail="No evaluations provided")
        
        # Convert legacy format to new format
        converted_evaluations = []
        for e in evaluations:
            converted = {
                'evaluation_id': e.get('evaluation_id', ''),
                'internship_id': e.get('internship_id', ''),
                'student_id': e.get('student_id', ''),
                'supervisor_id': e.get('supervisor_id', ''),
                'company_id': e.get('company_id', 'unknown'),
                'company_name': e.get('company_name', 'Unknown Company'),
                'university_id': e.get('university_id', 'unknown'),
                'university_name': e.get('university_name', 'Unknown University'),
                'position': e.get('position', 'Intern'),
                'supervisor_comments': e.get('text', e.get('supervisor_comments', '')),
                'total_score': e.get('total_score'),
                'final_grade': e.get('final_grade'),
                'approved_at': e.get('approved_at', e.get('created_at', time.strftime('%Y-%m-%dT%H:%M:%SZ')))
            }
            
            # Only include if we have valid text
            if converted['supervisor_comments'] and len(converted['supervisor_comments']) >= 10:
                converted_evaluations.append(converted)
        
        if not converted_evaluations:
            return {
                "status": "success",
                "total_evaluations_analyzed": 0,
                "insights": [],
                "generated_at": time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime())
            }
        
        # Get quick stats and insights using new engine
        result = ai_engine.get_dashboard_insights(converted_evaluations, max_insights=3)
        
        # Format response to match legacy format
        return {
            "status": "success",
            "total_evaluations_analyzed": len(converted_evaluations),
            "insights": result.get('insights', []),
            "generated_at": result.get('generated_at', time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime()))
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Legacy endpoint error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Analytics generation failed")


# =============================================================================
# RUN SERVER
# =============================================================================

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))
    logger.info(f"🚀 Starting AI Service on port {port}")
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=port,
        reload=True
    )
