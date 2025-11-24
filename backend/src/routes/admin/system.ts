import { Router } from 'express';
import systemController from '../../controllers/admin/systemController';
import { authenticateToken } from '../../middleware/auth';

const router = Router();

// All routes require authentication and admin role
// The authenticateToken middleware should check for admin role

/**
 * @route   GET /api/admin/system/metrics
 * @desc    Get overall system metrics
 * @access  Admin
 */
router.get('/metrics', authenticateToken, systemController.getMetrics);

/**
 * @route   GET /api/admin/system/health
 * @desc    Get system health status
 * @access  Admin
 */
router.get('/health', authenticateToken, systemController.getHealth);

/**
 * @route   GET /api/admin/system/services
 * @desc    Get services status
 * @access  Admin
 */
router.get('/services', authenticateToken, systemController.getServices);

/**
 * @route   GET /api/admin/system/application
 * @desc    Get application metrics
 * @access  Admin
 */
router.get('/application', authenticateToken, systemController.getApplicationMetrics);

/**
 * @route   GET /api/admin/system/database
 * @desc    Get database metrics
 * @access  Admin
 */
router.get('/database', authenticateToken, systemController.getDatabaseMetrics);

/**
 * @route   GET /api/admin/system/events
 * @desc    Get recent system events
 * @query   limit, severity, type
 * @access  Admin
 */
router.get('/events', authenticateToken, systemController.getRecentEvents);

/**
 * @route   GET /api/admin/system/metrics/trend/:metric
 * @desc    Get metrics trend for charts
 * @params  metric (users, sessions, api_calls, error_rate, response_time)
 * @query   hours (default 24)
 * @access  Admin
 */
router.get('/metrics/trend/:metric', authenticateToken, systemController.getMetricsTrend);

/**
 * @route   PATCH /api/admin/system/events/:eventId
 * @desc    Acknowledge/resolve an event
 * @body    { resolved: boolean }
 * @access  Admin
 */
router.patch('/events/:eventId', authenticateToken, systemController.acknowledgeEvent);

/**
 * @route   POST /api/admin/system/events/clear
 * @desc    Clear old events
 * @body    { olderThanDays: number }
 * @access  Admin
 */
router.post('/events/clear', authenticateToken, systemController.clearOldEvents);

/**
 * @route   GET /api/admin/system/performance
 * @desc    Get performance stats (slow queries, bottlenecks)
 * @access  Admin
 */
router.get('/performance', authenticateToken, systemController.getPerformance);

/**
 * @route   POST /api/admin/system/maintenance
 * @desc    Perform system maintenance action
 * @body    { action: 'clear_cache' | 'backup' | 'optimize' }
 * @access  Admin
 */
router.post('/maintenance', authenticateToken, systemController.performMaintenance);

/**
 * @route   GET /api/admin/system/errors
 * @desc    Get error breakdown by type
 * @access  Admin
 */
router.get('/errors', authenticateToken, systemController.getErrorBreakdown);

/**
 * @route   GET /api/admin/system/services/:serviceName/logs
 * @desc    Get logs for a specific service
 * @query   limit, severity
 * @access  Admin
 */
router.get('/services/:serviceName/logs', authenticateToken, systemController.getServiceLogs);

/**
 * @route   POST /api/admin/system/services/:serviceName/restart
 * @desc    Restart a specific service
 * @access  Admin
 */
router.post('/services/:serviceName/restart', authenticateToken, systemController.restartService);

export default router;
