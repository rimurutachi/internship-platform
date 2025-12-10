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
const weeklyReportsService = __importStar(require("../../services/weeklyReportsService"));
const router = (0, express_1.Router)();
// All routes require authentication and student role
router.use(auth_1.authenticateToken);
router.use((0, auth_1.requireRole)(['student']));
/**
 * GET /api/student/weekly-reports
 * Get all weekly reports for the authenticated student
 */
router.get('/weekly-reports', async (req, res) => {
    try {
        const studentId = req.user?.id;
        const { internship_id } = req.query;
        if (!studentId) {
            return res.status(401).json({
                success: false,
                error: 'Unauthorized',
            });
        }
        const result = await weeklyReportsService.getMyWeeklyReports(studentId, internship_id);
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
 * POST /api/student/weekly-reports
 * Create a new weekly report
 */
router.post('/weekly-reports', async (req, res) => {
    try {
        const studentId = req.user?.id;
        const reportData = req.body;
        if (!studentId) {
            return res.status(401).json({
                success: false,
                error: 'Unauthorized',
            });
        }
        const result = await weeklyReportsService.createWeeklyReport(studentId, reportData);
        if (!result.success) {
            return res.status(400).json(result);
        }
        return res.status(201).json(result);
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
 * GET /api/student/weekly-reports/:id
 * Get a specific weekly report
 */
router.get('/weekly-reports/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await weeklyReportsService.getWeeklyReportById(id);
        if (!result.success) {
            return res.status(404).json(result);
        }
        // Verify ownership
        if (result.data.student_id !== req.user?.id) {
            return res.status(403).json({
                success: false,
                error: 'Forbidden',
                message: 'You can only view your own reports',
            });
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
 * PUT /api/student/weekly-reports/:id
 * Update a weekly report (only if pending or rejected)
 */
router.put('/weekly-reports/:id', async (req, res) => {
    try {
        const studentId = req.user?.id;
        const { id } = req.params;
        const updates = req.body;
        if (!studentId) {
            return res.status(401).json({
                success: false,
                error: 'Unauthorized',
            });
        }
        const result = await weeklyReportsService.updateWeeklyReport(id, studentId, updates);
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
 * DELETE /api/student/weekly-reports/:id
 * Delete a weekly report (only if pending)
 */
router.delete('/weekly-reports/:id', async (req, res) => {
    try {
        const studentId = req.user?.id;
        const { id } = req.params;
        if (!studentId) {
            return res.status(401).json({
                success: false,
                error: 'Unauthorized',
            });
        }
        const result = await weeklyReportsService.deleteWeeklyReport(id, studentId);
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
 * GET /api/student/weekly-reports/next-deadline
 * Get next report deadline for student
 */
router.get('/weekly-reports/deadline/:internship_id', async (req, res) => {
    try {
        const studentId = req.user?.id;
        const { internship_id } = req.params;
        if (!studentId) {
            return res.status(401).json({
                success: false,
                error: 'Unauthorized',
            });
        }
        const result = await weeklyReportsService.getNextReportDeadline(studentId, internship_id);
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