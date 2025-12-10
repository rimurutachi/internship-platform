import { Router } from 'express';
import { authenticateToken, requireRole } from '../../middleware/auth';
import * as adminDashboardService from '../../services/adminDashboardService';

const router = Router();

// All routes require authentication and admin role
router.use(authenticateToken);
router.use(requireRole(['admin']));

/**
 * GET /api/admin/dashboard/metrics
 * Get real-time OJT-centric dashboard metrics
 */
router.get('/dashboard/metrics', async (req, res) => {
  try {
    const { university_id } = req.query;

    if (!university_id) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        message: 'university_id is required',
      });
    }

    const metrics = await adminDashboardService.calculateDashboardMetrics(
      university_id as string
    );

    return res.status(200).json({
      success: true,
      data: metrics,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message,
    });
  }
});

/**
 * GET /api/admin/dashboard/overview
 * Get complete dashboard overview (metrics + insights + activity)
 */
router.get('/dashboard/overview', async (req, res) => {
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

/**
 * GET /api/admin/dashboard/insights
 * Get AI-generated insights from evaluation analytics
 */
router.get('/dashboard/insights', async (req, res) => {
  try {
    const { university_id } = req.query;

    if (!university_id) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        message: 'university_id is required',
      });
    }

    const result = await adminDashboardService.getAIInsights(university_id as string);

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

/**
 * GET /api/admin/dashboard/quick-actions
 * Get items that need immediate attention
 */
router.get('/dashboard/quick-actions', async (req, res) => {
  try {
    const { university_id } = req.query;

    if (!university_id) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        message: 'university_id is required',
      });
    }

    const result = await adminDashboardService.getQuickActionItems(university_id as string);

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

/**
 * GET /api/admin/dashboard/historical
 * Get historical metrics for trend analysis
 */
router.get('/dashboard/historical', async (req, res) => {
  try {
    const { university_id, days } = req.query;

    if (!university_id) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        message: 'university_id is required',
      });
    }

    const daysNum = days ? parseInt(days as string, 10) : 30;

    const result = await adminDashboardService.getHistoricalMetrics(
      university_id as string,
      daysNum
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

/**
 * POST /api/admin/dashboard/snapshot
 * Store metrics snapshot (for daily cron job)
 */
router.post('/dashboard/snapshot', async (req, res) => {
  try {
    const { university_id } = req.body;

    if (!university_id) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        message: 'university_id is required',
      });
    }

    const result = await adminDashboardService.storeMetricsSnapshot(university_id);

    if (!result.success) {
      return res.status(500).json(result);
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
