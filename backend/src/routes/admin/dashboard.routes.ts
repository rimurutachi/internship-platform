import { Router } from 'express';
import dashboardController from '../../controllers/admin/dashboardController';
import { authenticateToken, requireRole } from '../../middleware/auth';
import * as adminDashboardService from '../../services/adminDashboardService';

const router = Router();

// All routes require authentication and admin role
router.use(authenticateToken);
router.use(requireRole(['admin']));

/**
 * GET /admin/dashboard/kpis
 * Get all KPI metrics for dashboard cards
 */
router.get('/kpis', (req, res) => dashboardController.getKPIs(req, res));

/**
 * GET /admin/dashboard/usage-engagement
 * Get user growth by role over months
 * Query params: months (default: 6)
 */
router.get('/usage-engagement', (req, res) => dashboardController.getUsageEngagement(req, res));

/**
 * GET /admin/dashboard/performance-metrics
 * Get system performance metrics over hours
 * Query params: hours (default: 24)
 */
router.get('/performance-metrics', (req, res) => dashboardController.getPerformanceMetrics(req, res));

/**
 * GET /admin/dashboard/feature-usage
 * Get feature usage analytics
 */
router.get('/feature-usage', (req, res) => dashboardController.getFeatureUsage(req, res));

/**
 * GET /admin/dashboard/overview
 * Get complete dashboard overview (all data in one call)
 */
router.get('/overview', (req, res) => dashboardController.getDashboardOverview(req, res));

/**
 * GET /admin/dashboard/ojt-overview
 * Get OJT-specific dashboard with real-time metrics
 * Query params: university_id (required)
 */
router.get('/ojt-overview', async (req, res) => {
  try {
    const { university_id } = req.query;

    if (!university_id) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        message: 'university_id is required',
      });
    }

    const result = await adminDashboardService.getAdminDashboardOverview(
      university_id as string
    );

    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.status(200).json(result);
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message,
    });
  }
});

export default router;
