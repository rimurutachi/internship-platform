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
const supervisorReportsService = __importStar(require("../../services/supervisorReportsService"));
const router = (0, express_1.Router)();
// All routes require authentication and supervisor role
router.use(auth_1.authenticateToken);
router.use((0, auth_1.requireRole)(['supervisor']));
/**
 * GET /api/supervisor/weekly-reports
 * Get all weekly reports for supervised internships
 */
router.get('/weekly-reports', async (req, res) => {
    try {
        const supervisorId = req.user?.id;
        const { internship_id, student_id, status, week_number } = req.query;
        if (!supervisorId) {
            return res.status(401).json({
                success: false,
                error: 'Unauthorized',
            });
        }
        const filters = {};
        if (internship_id)
            filters.internship_id = internship_id;
        if (student_id)
            filters.student_id = student_id;
        if (status)
            filters.status = status;
        if (week_number)
            filters.week_number = parseInt(week_number, 10);
        const result = await supervisorReportsService.getStudentReports(supervisorId, filters);
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
 * GET /api/supervisor/weekly-reports/pending-count
 * Get count of pending reports
 */
router.get('/weekly-reports/pending-count', async (req, res) => {
    try {
        const supervisorId = req.user?.id;
        if (!supervisorId) {
            return res.status(401).json({
                success: false,
                error: 'Unauthorized',
            });
        }
        const result = await supervisorReportsService.getPendingReportsCount(supervisorId);
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
 * GET /api/supervisor/weekly-reports/statistics
 * Get report statistics
 */
router.get('/weekly-reports/statistics', async (req, res) => {
    try {
        const supervisorId = req.user?.id;
        if (!supervisorId) {
            return res.status(401).json({
                success: false,
                error: 'Unauthorized',
            });
        }
        const result = await supervisorReportsService.getReportStatistics(supervisorId);
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
 * GET /api/supervisor/weekly-reports/summary-by-student
 * Get reports summary grouped by student
 */
router.get('/weekly-reports/summary-by-student', async (req, res) => {
    try {
        const supervisorId = req.user?.id;
        const { internship_id } = req.query;
        if (!supervisorId) {
            return res.status(401).json({
                success: false,
                error: 'Unauthorized',
            });
        }
        const result = await supervisorReportsService.getReportsSummaryByStudent(supervisorId, internship_id);
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
 * POST /api/supervisor/weekly-reports/:id/approve
 * Approve a weekly report
 */
router.post('/weekly-reports/:id/approve', async (req, res) => {
    try {
        const supervisorId = req.user?.id;
        const { id } = req.params;
        const { comments } = req.body;
        if (!supervisorId) {
            return res.status(401).json({
                success: false,
                error: 'Unauthorized',
            });
        }
        const result = await supervisorReportsService.approveWeeklyReport(id, supervisorId, comments);
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
 * POST /api/supervisor/weekly-reports/:id/reject
 * Reject a weekly report
 */
router.post('/weekly-reports/:id/reject', async (req, res) => {
    try {
        const supervisorId = req.user?.id;
        const { id } = req.params;
        const { rejection_reason } = req.body;
        if (!supervisorId) {
            return res.status(401).json({
                success: false,
                error: 'Unauthorized',
            });
        }
        if (!rejection_reason) {
            return res.status(400).json({
                success: false,
                error: 'Validation error',
                message: 'Rejection reason is required',
            });
        }
        const result = await supervisorReportsService.rejectWeeklyReport(id, supervisorId, rejection_reason);
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
 * POST /api/supervisor/weekly-reports/:id/comment
 * Add comment to a report without changing status
 */
router.post('/weekly-reports/:id/comment', async (req, res) => {
    try {
        const supervisorId = req.user?.id;
        const { id } = req.params;
        const { comment } = req.body;
        if (!supervisorId) {
            return res.status(401).json({
                success: false,
                error: 'Unauthorized',
            });
        }
        if (!comment) {
            return res.status(400).json({
                success: false,
                error: 'Validation error',
                message: 'Comment is required',
            });
        }
        const result = await supervisorReportsService.addCommentToReport(id, supervisorId, comment);
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
//# sourceMappingURL=weeklyReports.js.map