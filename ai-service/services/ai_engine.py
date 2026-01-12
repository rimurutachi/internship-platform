# ai-service/services/ai_engine.py
"""
AI Engine for Trend Analysis
Main orchestrator for historical evaluation analysis and decision support.

Version: 2.0.0 - Trend Analysis Focus
Purpose: Analyze approved evaluations to provide insights for internship placement decisions.

Components:
- TrendAnalyzer: Main trend analysis orchestrator
- PerformanceAnalyzer: Company and university performance statistics
- SkillTrendAnalyzer: Skill demand analysis over time and by company
- EnhancedSentimentAnalyzer: Sentiment extraction from feedback text
- FeatureExtractor: Skill extraction from feedback text
"""
import time
import logging
from typing import List, Dict, Any, Optional

from services.trend_analyzer import TrendAnalyzer
from services.performance_analyzer import PerformanceAnalyzer
from services.skill_trend_analyzer import SkillTrendAnalyzer
from services.feature_extractor import FeatureExtractor
from services.enhanced_sentiment_analyzer import EnhancedSentimentAnalyzer

logger = logging.getLogger(__name__)


class AIEngine:
    """
    Main AI Engine for Trend Analysis.
    
    Coordinates all analysis components to generate comprehensive insights
    from historical evaluation data for admin decision support.
    """

    def __init__(self):
        logger.info("🔵 Initializing AIEngine v2.0.0 - Trend Analysis")
        
        # Core analyzers
        self.trend_analyzer = TrendAnalyzer()
        self.performance_analyzer = PerformanceAnalyzer()
        self.skill_trend_analyzer = SkillTrendAnalyzer()
        
        # Supporting components (used by analyzers internally)
        self.feature_extractor = FeatureExtractor()
        self.sentiment_analyzer = EnhancedSentimentAnalyzer()
        
        logger.info("✅ AIEngine initialized with all trend analysis components")

    def analyze_trends(
        self,
        evaluations: List[Dict[str, Any]],
        options: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Main entry point for comprehensive trend analysis.
        
        Args:
            evaluations: List of approved evaluation data (validated by Pydantic)
            options: Analysis options:
                - include_recommendations: bool (default: True)
                - top_n_skills: int (default: 10)
                - top_n_companies: int (default: 10)
                - include_detailed_analysis: bool (default: False)
        
        Returns:
            Complete trend analysis result with:
            - insights: Top-level findings for dashboard
            - company_performance: Performance stats by company
            - university_performance: Performance stats by university
            - skill_trends: Skill demand analysis
            - sentiment_trends: Sentiment over time
            - recommendations: Decision support recommendations
        """
        start_time = time.time()
        options = options or {}
        
        logger.info(f"🔵 Starting comprehensive trend analysis for {len(evaluations)} evaluations")
        
        try:
            # Run main trend analysis
            result = self.trend_analyzer.analyze(evaluations, options)
            
            # Add detailed analysis if requested
            if options.get('include_detailed_analysis', False):
                logger.info("🔵 Including detailed analysis components")
                
                # Add university-company matrix
                matrix_result = self.performance_analyzer.analyze_university_company_matrix(evaluations)
                result['university_company_matrix'] = matrix_result
                
                # Add skill trends over time
                skill_time_trends = self.skill_trend_analyzer.analyze_skill_trends_over_time(evaluations)
                result['skill_time_trends'] = skill_time_trends
                
                # Add skills by company
                skills_by_company = self.skill_trend_analyzer.analyze_skills_by_company(evaluations)
                result['skills_by_company'] = skills_by_company
            
            # Calculate processing time
            processing_time = round((time.time() - start_time) * 1000, 2)
            result['processing_time_ms'] = processing_time
            result['status'] = 'success'
            result['generated_at'] = time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime())
            result['ai_version'] = '2.0.0-trends'
            
            logger.info(f"✅ Trend analysis complete in {processing_time}ms")
            
            return result
            
        except Exception as e:
            logger.error(f"❌ Trend analysis failed: {str(e)}", exc_info=True)
            raise

    def get_dashboard_insights(
        self,
        evaluations: List[Dict[str, Any]],
        max_insights: int = 5
    ) -> Dict[str, Any]:
        """
        Get quick insights for admin dashboard.
        Lighter-weight analysis for dashboard cards.
        
        Args:
            evaluations: List of approved evaluation data
            max_insights: Maximum number of insights to return
        
        Returns:
            {
                'status': 'success',
                'total_evaluations': int,
                'insights': [...],
                'quick_stats': {...},
                'generated_at': str
            }
        """
        start_time = time.time()
        
        logger.info(f"🔵 Generating dashboard insights from {len(evaluations)} evaluations")
        
        try:
            # Get quick stats
            quick_stats = self.trend_analyzer.get_quick_stats(evaluations)
            
            # Run basic trend analysis with limited options
            result = self.trend_analyzer.analyze(evaluations, {
                'include_recommendations': False,
                'top_n_skills': 5,
                'top_n_companies': 5
            })
            
            # Extract top insights
            insights = result.get('insights', [])[:max_insights]
            
            processing_time = round((time.time() - start_time) * 1000, 2)
            
            logger.info(f"✅ Dashboard insights generated in {processing_time}ms")
            
            return {
                'status': 'success',
                'total_evaluations': len(evaluations),
                'insights': insights,
                'quick_stats': quick_stats,
                'generated_at': time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime()),
                'processing_time_ms': processing_time
            }
            
        except Exception as e:
            logger.error(f"❌ Dashboard insights failed: {str(e)}", exc_info=True)
            raise

    def analyze_company_performance(
        self,
        evaluations: List[Dict[str, Any]],
        university_filter: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Get detailed company performance analysis.
        
        Args:
            evaluations: List of approved evaluation data
            university_filter: Optional university_id to filter results
        
        Returns:
            Company rankings with performance metrics
        """
        logger.info(f"🔵 Analyzing company performance (university_filter={university_filter})")
        
        start_time = time.time()
        
        try:
            rankings = self.performance_analyzer.analyze_company_ranking(
                evaluations,
                university_filter
            )
            
            processing_time = round((time.time() - start_time) * 1000, 2)
            
            logger.info(f"✅ Company analysis complete: {len(rankings)} companies")
            
            return {
                'status': 'success',
                'rankings': rankings,
                'total_companies': len(rankings),
                'university_filter': university_filter,
                'processing_time_ms': processing_time
            }
            
        except Exception as e:
            logger.error(f"❌ Company analysis failed: {str(e)}", exc_info=True)
            raise

    def analyze_university_performance(
        self,
        evaluations: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        Get detailed university performance comparison.
        
        Args:
            evaluations: List of approved evaluation data
        
        Returns:
            University rankings and comparison insights
        """
        logger.info(f"🔵 Analyzing university performance")
        
        start_time = time.time()
        
        try:
            result = self.performance_analyzer.compare_universities(evaluations)
            
            processing_time = round((time.time() - start_time) * 1000, 2)
            result['processing_time_ms'] = processing_time
            result['status'] = 'success'
            
            logger.info(f"✅ University analysis complete: {len(result.get('rankings', []))} universities")
            
            return result
            
        except Exception as e:
            logger.error(f"❌ University analysis failed: {str(e)}", exc_info=True)
            raise

    def get_university_company_matrix(
        self,
        evaluations: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        Get cross-tabulation of university × company performance.
        Key analysis for: "Where do CvSU students perform best?"
        
        Args:
            evaluations: List of approved evaluation data
        
        Returns:
            Matrix with best and worst matches
        """
        logger.info(f"🔵 Building university-company performance matrix")
        
        start_time = time.time()
        
        try:
            result = self.performance_analyzer.analyze_university_company_matrix(evaluations)
            
            processing_time = round((time.time() - start_time) * 1000, 2)
            result['processing_time_ms'] = processing_time
            result['status'] = 'success'
            
            logger.info(f"✅ Matrix analysis complete")
            
            return result
            
        except Exception as e:
            logger.error(f"❌ Matrix analysis failed: {str(e)}", exc_info=True)
            raise

    def analyze_skill_demands(
        self,
        evaluations: List[Dict[str, Any]],
        company_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Analyze skill demands across companies or for a specific company.
        
        Args:
            evaluations: List of approved evaluation data
            company_id: Optional company_id to focus analysis
        
        Returns:
            Skill analysis with trends and recommendations
        """
        logger.info(f"🔵 Analyzing skill demands (company={company_id})")
        
        start_time = time.time()
        
        try:
            # Get skills by company
            company_skills = self.skill_trend_analyzer.analyze_skills_by_company(evaluations)
            
            # Get time trends
            time_trends = self.skill_trend_analyzer.analyze_skill_trends_over_time(evaluations)
            
            # Get skill gap analysis
            skill_gap = self.skill_trend_analyzer.analyze_skill_gap(evaluations, company_id)
            
            # Get recommendations
            recommendations = self.skill_trend_analyzer.get_skill_recommendations(evaluations)
            
            processing_time = round((time.time() - start_time) * 1000, 2)
            
            logger.info(f"✅ Skill analysis complete")
            
            return {
                'status': 'success',
                'skills_by_company': company_skills,
                'time_trends': time_trends,
                'skill_gap': skill_gap,
                'recommendations': recommendations,
                'processing_time_ms': processing_time
            }
            
        except Exception as e:
            logger.error(f"❌ Skill analysis failed: {str(e)}", exc_info=True)
            raise

    def get_health_status(self) -> Dict[str, Any]:
        """
        Health check for AI Engine.
        Returns status of all components.
        """
        return {
            "status": "healthy",
            "version": "2.0.0-trends",
            "components": {
                "trend_analyzer": "operational",
                "performance_analyzer": "operational",
                "skill_trend_analyzer": "operational",
                "feature_extractor": "operational",
                "sentiment_analyzer": "operational"
            },
            "capabilities": [
                "Historical trend analysis",
                "Company performance ranking",
                "University performance comparison",
                "University-Company performance matrix",
                "Skill demand analysis",
                "Sentiment trend tracking",
                "Decision support recommendations"
            ],
            "purpose": "Analyze approved evaluations for admin decision support"
        }

