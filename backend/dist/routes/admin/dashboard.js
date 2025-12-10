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
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../../middleware/auth");
const adminDashboardService = __importStar(require("../../services/adminDashboardService"));
const router = (0, express_1.Router)();
// All routes require authentication and admin role
router.use(auth_1.authenticateToken);
router.use((0, auth_1.requireRole)(['admin']));
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
        const metrics = await adminDashboardService.calculateDashboardMetrics(university_id);
        return res.status(200).json({
            success: true,
            data: metrics,
        });
    }
    catch (error) {
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
        const result = await adminDashboardService.getAIInsights(university_id);
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
        const result = await adminDashboardService.getQuickActionItems(university_id);
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
        const daysNum = days ? parseInt(days, 10) : 30;
        const result = await adminDashboardService.getHistoricalMetrics(university_id, daysNum);
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
//# sourceMappingURL=dashboard.js.map