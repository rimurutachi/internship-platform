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
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
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

# Initialize AI Engine
logger.info("🚀 Starting Intern-Galing AI Service v2.0.0 - Trend Analysis")
ai_engine = AIEngine()

# Create FastAPI app
app = FastAPI(
    title="Intern-Galing AI Service",
    description="Historical Trend Analysis for Internship Evaluations - Decision Support System",
    version="2.0.0"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
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
async def analyze_trends(request: TrendAnalysisRequest):
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
        eval_count = len(request.evaluations)
        logger.info(f"🔵 POST /api/analyze-trends - Analyzing {eval_count} evaluations")
        
        if eval_count == 0:
            logger.warning("⚠️ No evaluations provided for analysis")
            raise HTTPException(status_code=400, detail="No evaluations provided for analysis")
        
        # Convert Pydantic models to dicts for processing
        evaluations = [e.model_dump() for e in request.evaluations]
        
        # Build options from request
        options = {
            'include_recommendations': request.include_recommendations,
            'top_n_skills': request.top_n_skills,
            'top_n_companies': request.top_n_companies,
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
async def get_dashboard_insights(request: DashboardInsightRequest):
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
        eval_count = len(request.evaluations)
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
        evaluations = [e.model_dump() for e in request.evaluations]
        
        # Get dashboard insights
        result = ai_engine.get_dashboard_insights(evaluations, request.max_insights)
        
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
async def analyze_company_performance(request: TrendAnalysisRequest):
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
        eval_count = len(request.evaluations)
        logger.info(f"🔵 POST /api/company-performance - Analyzing {eval_count} evaluations")
        
        if eval_count == 0:
            raise HTTPException(status_code=400, detail="No evaluations provided")
        
        evaluations = [e.model_dump() for e in request.evaluations]
        
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
async def analyze_university_performance(request: TrendAnalysisRequest):
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
        eval_count = len(request.evaluations)
        logger.info(f"🔵 POST /api/university-performance - Analyzing {eval_count} evaluations")
        
        if eval_count == 0:
            raise HTTPException(status_code=400, detail="No evaluations provided")
        
        evaluations = [e.model_dump() for e in request.evaluations]
        
        result = ai_engine.analyze_university_performance(evaluations)
        
        logger.info(f"✅ University analysis complete: {len(result.get('rankings', []))} universities compared")
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ University analysis error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to analyze university performance")


@app.post("/api/university-company-matrix")
async def get_university_company_matrix(request: TrendAnalysisRequest):
    """
    University × Company performance matrix.
    
    Cross-tabulation showing how each university performs at each company.
    Key analysis for: "Where do CvSU students perform best?"
    
    Returns:
        Matrix with best and worst matches per university
    """
    try:
        eval_count = len(request.evaluations)
        logger.info(f"🔵 POST /api/university-company-matrix - Building matrix from {eval_count} evaluations")
        
        if eval_count == 0:
            raise HTTPException(status_code=400, detail="No evaluations provided")
        
        evaluations = [e.model_dump() for e in request.evaluations]
        
        result = ai_engine.get_university_company_matrix(evaluations)
        
        logger.info(f"✅ Matrix built: {len(result.get('best_matches', []))} best matches, {len(result.get('avoid_matches', []))} avoid matches")
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Matrix analysis error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to build university-company matrix")


@app.post("/api/skill-analysis")
async def analyze_skills(request: TrendAnalysisRequest):
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
        eval_count = len(request.evaluations)
        logger.info(f"🔵 POST /api/skill-analysis - Analyzing skills from {eval_count} evaluations")
        
        if eval_count == 0:
            raise HTTPException(status_code=400, detail="No evaluations provided")
        
        evaluations = [e.model_dump() for e in request.evaluations]
        
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
async def evaluate_post_approval_legacy(evaluations: list[dict]):
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
