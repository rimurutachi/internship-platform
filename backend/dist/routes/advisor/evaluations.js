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
const advisorEvaluationService = __importStar(require("../../services/advisorEvaluationService"));
const router = (0, express_1.Router)();
// All routes require authentication and advisor role
router.use(auth_1.authenticateToken);
router.use((0, auth_1.requireRole)(['advisor']));
/**
 * GET /api/advisor/evaluations/pending
 * Get all pending evaluations (submitted status)
 */
router.get('/evaluations/pending', async (req, res) => {
    try {
        const advisorId = req.user?.id;
        if (!advisorId) {
            return res.status(401).json({
                success: false,
                error: 'Unauthorized',
            });
        }
        const result = await advisorEvaluationService.getPendingEvaluations(advisorId);
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
 * GET /api/advisor/evaluations/status/:status
 * Get evaluations by status
 * Status: submitted | revision_requested | approved
 */
router.get('/evaluations/status/:status', async (req, res) => {
    try {
        const advisorId = req.user?.id;
        const { status } = req.params;
        if (!advisorId) {
            return res.status(401).json({
                success: false,
                error: 'Unauthorized',
            });
        }
        const validStatuses = ['submitted', 'revision_requested', 'approved'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid status',
                message: 'Status must be: submitted, revision_requested, or approved',
            });
        }
        const result = await advisorEvaluationService.getEvaluationsByStatus(advisorId, status);
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
 * GET /api/advisor/evaluations/:id/context
 * Get evaluation with full context (including weekly reports)
 */
router.get('/evaluations/:id/context', async (req, res) => {
    try {
        const advisorId = req.user?.id;
        const { id } = req.params;
        if (!advisorId) {
            return res.status(401).json({
                success: false,
                error: 'Unauthorized',
            });
        }
        const result = await advisorEvaluationService.getEvaluationWithContext(id, advisorId);
        if (!result.success) {
            return res.status(404).json(result);
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
 * GET /api/advisor/evaluations/statistics
 * Get evaluation statistics for advisor dashboard
 */
router.get('/evaluations/statistics', async (req, res) => {
    try {
        const advisorId = req.user?.id;
        if (!advisorId) {
            return res.status(401).json({
                success: false,
                error: 'Unauthorized',
            });
        }
        const result = await advisorEvaluationService.getEvaluationStatistics(advisorId);
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
 * POST /api/advisor/evaluations/:id/approve
 * Approve an evaluation
 */
router.post('/evaluations/:id/approve', async (req, res) => {
    try {
        const advisorId = req.user?.id;
        const { id } = req.params;
        const approvalData = req.body;
        if (!advisorId) {
            return res.status(401).json({
                success: false,
                error: 'Unauthorized',
            });
        }
        if (!approvalData.approval_comments) {
            return res.status(400).json({
                success: false,
                error: 'Validation error',
                message: 'Approval comments are required',
            });
        }
        const result = await advisorEvaluationService.approveEvaluation(id, advisorId, approvalData);
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
 * POST /api/advisor/evaluations/:id/request-revision
 * Request revision on an evaluation
 */
router.post('/evaluations/:id/request-revision', async (req, res) => {
    try {
        const advisorId = req.user?.id;
        const { id } = req.params;
        const { revision_reason } = req.body;
        if (!advisorId) {
            return res.status(401).json({
                success: false,
                error: 'Unauthorized',
            });
        }
        if (!revision_reason) {
            return res.status(400).json({
                success: false,
                error: 'Validation error',
                message: 'Revision reason is required',
            });
        }
        const result = await advisorEvaluationService.requestRevision(id, advisorId, revision_reason);
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
 * GET /api/advisor/weekly-reports/internship/:internship_id
 * Get weekly reports for context
 */
router.get('/weekly-reports/internship/:internship_id', async (req, res) => {
    try {
        const { internship_id } = req.params;
        const result = await advisorEvaluationService.getWeeklyReportsForContext(internship_id);
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
//# sourceMappingURL=evaluations.js.map