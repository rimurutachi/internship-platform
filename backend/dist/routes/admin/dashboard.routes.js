"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const dashboardController_1 = __importDefault(require("../../controllers/admin/dashboardController"));
const auth_1 = require("../../middleware/auth");
const adminDashboardService = __importStar(require("../../services/adminDashboardService"));
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
        const result = await adminDashboardService.getAdminDashboardOverview(university_id);
        if (!result.success) {
            return res.status(400).json(result);
        }
        return res.status(200).json(result);
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            error: 'Internal server error',
            message: error.message,
        });
    }
});
exports.default = router;
//# sourceMappingURL=dashboard.routes.js.map