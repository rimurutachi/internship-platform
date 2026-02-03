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
router.get('/metrics', async (req, res) => {
  console.log('[admin/dashboard] GET /metrics', req.query);
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

    console.log('[admin/dashboard] /metrics success', { university_id: university_id as string, metrics });
    return res.status(200).json({
      success: true,
      data: metrics,
    });
  } catch (error: any) {
    console.error('[admin/dashboard] /metrics error', error);
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
router.get('/overview', async (req, res) => {
  console.log('[admin/dashboard] GET /overview', req.query);
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

    console.log('[admin/dashboard] /overview success', { university_id: university_id as string });
    return res.status(200).json(result);
  } catch (error: any) {
    console.error('[admin/dashboard] /overview error', error);
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
router.get('/insights', async (req, res) => {
  console.log('[admin/dashboard] GET /insights', req.query);
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

    console.log('[admin/dashboard] /insights success', { university_id: university_id as string });
    return res.status(200).json(result);
  } catch (error: any) {
    console.error('[admin/dashboard] /insights error', error);
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
router.get('/quick-actions', async (req, res) => {
  console.log('[admin/dashboard] GET /quick-actions', req.query);
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

    console.log('[admin/dashboard] /quick-actions success', { university_id: university_id as string });
    return res.status(200).json(result);
  } catch (error: any) {
    console.error('[admin/dashboard] /quick-actions error', error);
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
router.get('/historical', async (req, res) => {
  console.log('[admin/dashboard] GET /historical', req.query);
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

    console.log('[admin/dashboard] /historical success', { university_id: university_id as string, days: daysNum });
    return res.status(200).json(result);
  } catch (error: any) {
    console.error('[admin/dashboard] /historical error', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message,
    });
  }
});

// Alias used by frontend: /api/admin/dashboard/ojt-overview
router.get('/ojt-overview', async (req, res) => {
  console.log('[admin/dashboard] GET /ojt-overview', req.query);
  try {
    const { university_id } = req.query;

    if (!university_id) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        message: 'university_id is required',
      });
    }

    // Use the full overview shape expected by the frontend
    const overview = await adminDashboardService.getAdminDashboardOverview(
      university_id as string
    );

    if (!overview.success) {
      return res.status(400).json(overview);
    }

    console.log('[admin/dashboard] /ojt-overview success', { university_id: university_id as string });
    return res.status(200).json({ success: true, data: overview.data });
  } catch (error: any) {
    console.error('[admin/dashboard] /ojt-overview error', error);
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
router.post('/snapshot', async (req, res) => {
  console.log('[admin/dashboard] POST /snapshot', req.body);
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

    console.log('[admin/dashboard] /snapshot success', { university_id });
    return res.status(200).json(result);
  } catch (error: any) {
    console.error('[admin/dashboard] /snapshot error', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message,
    });
  }
});

/**
 * GET /api/admin/dashboard/company-capacity
 * Get detailed company capacity breakdown
 */
router.get('/company-capacity', async (req, res) => {
  console.log('[admin/dashboard] GET /company-capacity', req.query);
  try {
    const { university_id } = req.query;

    if (!university_id) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        message: 'university_id is required',
      });
    }

    const result = await adminDashboardService.getCompanyCapacityBreakdown(
      university_id as string
    );

    if (!result.success) {
      return res.status(400).json(result);
    }

    console.log('[admin/dashboard] /company-capacity success', { university_id: university_id as string });
    return res.status(200).json(result);
  } catch (error: any) {
    console.error('[admin/dashboard] /company-capacity error', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message,
    });
  }
});

export default router;
