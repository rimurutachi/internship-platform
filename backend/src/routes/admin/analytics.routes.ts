/**
 * Admin Analytics Routes - AI Trend Analysis
 * 
 * Endpoints for admin to access AI-powered trend analysis on approved evaluations.
 * All routes are admin-only and on-demand (no automatic triggers).
 * 
 * @version 2.0.0
 */

import { Router, Request, Response } from 'express';
import { authenticateToken, requireRole } from '../../middleware/auth';
import * as analyticsService from '../../services/analyticsService';

const router = Router();

// All routes require authentication and admin role
router.use(authenticateToken);
router.use(requireRole(['admin']));

/**
 * GET /api/admin/analytics/trends
 * 
 * Comprehensive trend analysis on approved evaluations
 * Returns insights, recommendations, company/university performance, skills, sentiment
 */
router.get('/trends', async (req: Request, res: Response) => {
  try {
    console.log('🔵 [Analytics Route] GET /trends');

    const {
      limit,
      university_id,
      company_id,
      date_from,
      date_to,
      top_skills,
      top_companies,
    } = req.query;

    const result = await analyticsService.getTrendAnalysis({
      limit: limit ? parseInt(limit as string) : undefined,
      universityId: university_id as string,
      companyId: company_id as string,
      date_range_start: date_from as string,
      date_range_end: date_to as string,
      top_n_skills: top_skills ? parseInt(top_skills as string) : undefined,
      top_n_companies: top_companies ? parseInt(top_companies as string) : undefined,
      include_recommendations: true,
    });

    res.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error('❌ [Analytics Route] Trend analysis failed:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to analyze trends',
    });
  }
});

/**
 * GET /api/admin/analytics/dashboard-insights
 * 
 * Quick insights for admin dashboard cards
 * Lightweight endpoint for dashboard summary
 */
router.get('/dashboard-insights', async (req: Request, res: Response) => {
  try {
    console.log('🔵 [Analytics Route] GET /dashboard-insights');

    const { max_insights, limit, university_id } = req.query;

    const result = await analyticsService.getDashboardInsights({
      maxInsights: max_insights ? parseInt(max_insights as string) : 5,
      limit: limit ? parseInt(limit as string) : 50,
      universityId: university_id as string,
    });

    res.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error('❌ [Analytics Route] Dashboard insights failed:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get dashboard insights',
    });
  }
});

/**
 * GET /api/admin/analytics/companies
 * 
 * Company performance rankings
 * Shows where students perform best/worst
 */
router.get('/companies', async (req: Request, res: Response) => {
  try {
    console.log('🔵 [Analytics Route] GET /companies');

    const { top_n, limit, university_id } = req.query;

    const result = await analyticsService.getCompanyPerformance({
      topN: top_n ? parseInt(top_n as string) : 10,
      limit: limit ? parseInt(limit as string) : 200,
      universityId: university_id as string,
    });

    res.json({
      success: true,
      data: {
        companies: result,
        count: result.length,
      },
    });
  } catch (error: any) {
    console.error('❌ [Analytics Route] Company performance failed:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get company performance',
    });
  }
});

/**
 * GET /api/admin/analytics/universities
 * 
 * University performance comparison
 * Shows how different universities' students perform
 */
router.get('/universities', async (req: Request, res: Response) => {
  try {
    console.log('🔵 [Analytics Route] GET /universities');

    const { limit, company_id } = req.query;

    const result = await analyticsService.getUniversityPerformance({
      limit: limit ? parseInt(limit as string) : 200,
      companyId: company_id as string,
    });

    res.json({
      success: true,
      data: {
        universities: result,
        count: result.length,
      },
    });
  } catch (error: any) {
    console.error('❌ [Analytics Route] University performance failed:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get university performance',
    });
  }
});

/**
 * GET /api/admin/analytics/matrix
 * 
 * University-Company performance cross-tabulation
 * Answers: "Where do CvSU students perform best?"
 */
router.get('/matrix', async (req: Request, res: Response) => {
  try {
    console.log('🔵 [Analytics Route] GET /matrix');

    const { limit } = req.query;

    const result = await analyticsService.getUniversityCompanyMatrix({
      limit: limit ? parseInt(limit as string) : 200,
    });

    res.json({
      success: true,
      data: {
        matrix: result,
      },
    });
  } catch (error: any) {
    console.error('❌ [Analytics Route] Matrix analysis failed:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get performance matrix',
    });
  }
});

/**
 * GET /api/admin/analytics/skills
 * 
 * Skill demand analysis
 * Shows most demanded technical and soft skills
 */
router.get('/skills', async (req: Request, res: Response) => {
  try {
    console.log('🔵 [Analytics Route] GET /skills');

    const { top_n, limit, university_id, company_id } = req.query;

    const result = await analyticsService.getSkillAnalysis({
      topN: top_n ? parseInt(top_n as string) : 10,
      limit: limit ? parseInt(limit as string) : 200,
      universityId: university_id as string,
      companyId: company_id as string,
    });

    res.json({
      success: true,
      data: result || {
        technical_skills: [],
        soft_skills: [],
        total_unique_skills: 0,
        most_demanded_overall: [],
      },
    });
  } catch (error: any) {
    console.error('❌ [Analytics Route] Skill analysis failed:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get skill analysis',
    });
  }
});

/**
 * GET /api/admin/analytics/health
 * 
 * Check AI service health status
 */
router.get('/health', async (req: Request, res: Response) => {
  try {
    const aiService = (await import('../../services/aiService')).default;
    const health = await aiService.getHealthStatus();
    
    res.json({
      success: true,
      data: health,
    });
  } catch (error: any) {
    res.status(503).json({
      success: false,
      error: 'AI service is not available',
      details: error.message,
    });
  }
});

export default router;
