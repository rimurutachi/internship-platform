"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const systemController_1 = __importDefault(require("../../controllers/admin/systemController"));
const auth_1 = require("../../middleware/auth");
const router = (0, express_1.Router)();
// All routes require authentication and admin role
// The authenticateToken middleware should check for admin role
/**
 * @route   GET /api/admin/system/metrics
 * @desc    Get overall system metrics
 * @access  Admin
 */
router.get('/metrics', auth_1.authenticateToken, systemController_1.default.getMetrics);
/**
 * @route   GET /api/admin/system/health
 * @desc    Get system health status
 * @access  Admin
 */
router.get('/health', auth_1.authenticateToken, systemController_1.default.getHealth);
/**
 * @route   GET /api/admin/system/services
 * @desc    Get services status
 * @access  Admin
 */
router.get('/services', auth_1.authenticateToken, systemController_1.default.getServices);
/**
 * @route   GET /api/admin/system/application
 * @desc    Get application metrics
 * @access  Admin
 */
router.get('/application', auth_1.authenticateToken, systemController_1.default.getApplicationMetrics);
/**
 * @route   GET /api/admin/system/database
 * @desc    Get database metrics
 * @access  Admin
 */
router.get('/database', auth_1.authenticateToken, systemController_1.default.getDatabaseMetrics);
/**
 * @route   GET /api/admin/system/events
 * @desc    Get recent system events
 * @query   limit, severity, type
 * @access  Admin
 */
router.get('/events', auth_1.authenticateToken, systemController_1.default.getRecentEvents);
/**
 * @route   GET /api/admin/system/metrics/trend/:metric
 * @desc    Get metrics trend for charts
 * @params  metric (users, sessions, api_calls, error_rate, response_time)
 * @query   hours (default 24)
 * @access  Admin
 */
router.get('/metrics/trend/:metric', auth_1.authenticateToken, systemController_1.default.getMetricsTrend);
/**
 * @route   PATCH /api/admin/system/events/:eventId
 * @desc    Acknowledge/resolve an event
 * @body    { resolved: boolean }
 * @access  Admin
 */
router.patch('/events/:eventId', auth_1.authenticateToken, systemController_1.default.acknowledgeEvent);
/**
 * @route   POST /api/admin/system/events/clear
 * @desc    Clear old events
 * @body    { olderThanDays: number }
 * @access  Admin
 */
router.post('/events/clear', auth_1.authenticateToken, systemController_1.default.clearOldEvents);
/**
 * @route   GET /api/admin/system/performance
 * @desc    Get performance stats (slow queries, bottlenecks)
 * @access  Admin
 */
router.get('/performance', auth_1.authenticateToken, systemController_1.default.getPerformance);
/**
 * @route   POST /api/admin/system/maintenance
 * @desc    Perform system maintenance action
 * @body    { action: 'clear_cache' | 'backup' | 'optimize' }
 * @access  Admin
 */
router.post('/maintenance', auth_1.authenticateToken, systemController_1.default.performMaintenance);
/**
 * @route   GET /api/admin/system/errors
 * @desc    Get error breakdown by type
 * @access  Admin
 */
router.get('/errors', auth_1.authenticateToken, systemController_1.default.getErrorBreakdown);
/**
 * @route   GET /api/admin/system/services/:serviceName/logs
 * @desc    Get logs for a specific service
 * @query   limit, severity
 * @access  Admin
 */
router.get('/services/:serviceName/logs', auth_1.authenticateToken, systemController_1.default.getServiceLogs);
/**
 * @route   POST /api/admin/system/services/:serviceName/restart
 * @desc    Restart a specific service
 * @access  Admin
 */
router.post('/services/:serviceName/restart', auth_1.authenticateToken, systemController_1.default.restartService);
exports.default = router;
//# sourceMappingURL=system.js.map