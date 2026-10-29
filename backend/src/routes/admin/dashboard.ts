import { Router } from 'express';
import { authenticateToken, requireRole } from '../../middleware/auth';
import * as adminDashboardService from '../../services/adminDashboardService';
import { createClient } from '@supabase/supabase-js';

const router = Router();

const supabase = createClient(
  process.env.SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_KEY as string
);

/**
 * Helper to ensure a valid university_id is always resolved
 */
async function resolveUniversityId(req: any): Promise<string> {
  const queryUniv = req.query.university_id;
  if (queryUniv && queryUniv !== 'null' && queryUniv !== 'undefined') {
    return queryUniv as string;
  }
  const userUniv = req.user?.university_id;
  if (userUniv) return userUniv;

  try {
    const { data: firstUniv } = await supabase
      .from('universities')
      .select('id')
      .limit(1)
      .single();
    return firstUniv?.id || '';
  } catch {
    return '';
  }
}

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
    const universityId = await resolveUniversityId(req);

    if (!universityId) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        message: 'university_id is required and could not be determined',
      });
    }

    const metrics = await adminDashboardService.calculateDashboardMetrics(universityId);

    console.log('[admin/dashboard] /metrics success', { university_id: universityId, metrics });
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
    const universityId = await resolveUniversityId(req);
    const forceRefresh = req.query.refresh === 'true';

    if (!universityId) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        message: 'university_id is required and could not be determined',
      });
    }

    const result = await adminDashboardService.getAdminDashboardOverview(universityId, forceRefresh);

    if (!result.success) {
      return res.status(400).json(result);
    }

    console.log('[admin/dashboard] /overview success', { university_id: universityId });
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
    const universityId = await resolveUniversityId(req);

    if (!universityId) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        message: 'university_id is required and could not be determined',
      });
    }

    const result = await adminDashboardService.getAIInsights(universityId);

    if (!result.success) {
      return res.status(400).json(result);
    }

    console.log('[admin/dashboard] /insights success', { university_id: universityId });
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
    const universityId = await resolveUniversityId(req);

    if (!universityId) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        message: 'university_id is required and could not be determined',
      });
    }

    const result = await adminDashboardService.getQuickActionItems(universityId);

    if (!result.success) {
      return res.status(400).json(result);
    }

    console.log('[admin/dashboard] /quick-actions success', { university_id: universityId });
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
    const universityId = await resolveUniversityId(req);
    const { days } = req.query;

    if (!universityId) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        message: 'university_id is required and could not be determined',
      });
    }

    const daysNum = days ? parseInt(days as string, 10) : 30;

    const result = await adminDashboardService.getHistoricalMetrics(
      universityId,
      daysNum
    );

    if (!result.success) {
      return res.status(400).json(result);
    }

    console.log('[admin/dashboard] /historical success', { university_id: universityId, days: daysNum });
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
    const universityId = await resolveUniversityId(req);
    const forceRefresh = req.query.refresh === 'true';

    if (!universityId) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        message: 'university_id is required and could not be determined',
      });
    }

    // Use the full overview shape expected by the frontend
    const overview = await adminDashboardService.getAdminDashboardOverview(
      universityId,
      forceRefresh
    );

    if (!overview.success) {
      return res.status(400).json(overview);
    }

    console.log('[admin/dashboard] /ojt-overview success', { university_id: universityId });
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
    let universityId = req.body?.university_id;
    if (!universityId) {
      universityId = await resolveUniversityId(req);
    }

    if (!universityId) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        message: 'university_id is required and could not be determined',
      });
    }

    const result = await adminDashboardService.storeMetricsSnapshot(universityId);

    if (!result.success) {
      return res.status(500).json(result);
    }

    console.log('[admin/dashboard] /snapshot success', { university_id: universityId });
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
    const universityId = await resolveUniversityId(req);

    if (!universityId) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        message: 'university_id is required and could not be determined',
      });
    }

    const result = await adminDashboardService.getCompanyCapacityBreakdown(
      universityId
    );

    if (!result.success) {
      return res.status(400).json(result);
    }

    console.log('[admin/dashboard] /company-capacity success', { university_id: universityId });
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
