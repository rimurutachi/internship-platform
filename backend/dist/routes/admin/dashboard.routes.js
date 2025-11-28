"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const dashboardController_1 = __importDefault(require("../../controllers/admin/dashboardController"));
const auth_1 = require("../../middleware/auth");
const router = (0, express_1.Router)();
// All routes require authentication and admin role
router.use(auth_1.authenticateToken);
router.use((0, auth_1.requireRole)(['admin']));
/**
 * GET /admin/dashboard/kpis
 * Get all KPI metrics for dashboard cards
 */
router.get('/kpis', (req, res) => dashboardController_1.default.getKPIs(req, res));
/**
 * GET /admin/dashboard/usage-engagement
 * Get user growth by role over months
 * Query params: months (default: 6)
 */
router.get('/usage-engagement', (req, res) => dashboardController_1.default.getUsageEngagement(req, res));
/**
 * GET /admin/dashboard/performance-metrics
 * Get system performance metrics over hours
 * Query params: hours (default: 24)
 */
router.get('/performance-metrics', (req, res) => dashboardController_1.default.getPerformanceMetrics(req, res));
/**
 * GET /admin/dashboard/feature-usage
 * Get feature usage analytics
 */
router.get('/feature-usage', (req, res) => dashboardController_1.default.getFeatureUsage(req, res));
/**
 * GET /admin/dashboard/overview
 * Get complete dashboard overview (all data in one call)
 */
router.get('/overview', (req, res) => dashboardController_1.default.getDashboardOverview(req, res));
exports.default = router;
//# sourceMappingURL=dashboard.routes.js.map