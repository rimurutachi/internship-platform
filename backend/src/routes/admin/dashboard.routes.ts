import { Router } from 'express';
import dashboardController from '../../controllers/admin/dashboardController';
import { authenticateToken, requireRole } from '../../middleware/auth';

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

export default router;
