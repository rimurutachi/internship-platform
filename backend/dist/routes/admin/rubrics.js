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
const rubricService = __importStar(require("../../services/rubricService"));
const router = (0, express_1.Router)();
// All routes require authentication and admin role
router.use(auth_1.authenticateToken);
router.use((0, auth_1.requireRole)(['admin']));
/**
 * GET /api/admin/rubrics
 * Get all rubrics for university
 */
router.get('/rubrics', async (req, res) => {
    try {
        const { university_id, include_inactive } = req.query;
        if (!university_id) {
            return res.status(400).json({
                success: false,
                error: 'Validation error',
                message: 'university_id is required',
            });
        }
        const result = await rubricService.getAllRubrics(university_id, include_inactive === 'true');
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
 * GET /api/admin/rubrics/active
 * Get active rubric for university
 */
router.get('/rubrics/active', async (req, res) => {
    try {
        const { university_id } = req.query;
        if (!university_id) {
            return res.status(400).json({
                success: false,
                error: 'Validation error',
                message: 'university_id is required',
            });
        }
        const result = await rubricService.getActiveRubric(university_id);
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
 * GET /api/admin/rubrics/:id
 * Get rubric by ID
 */
router.get('/rubrics/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await rubricService.getRubricById(id);
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
 * GET /api/admin/rubrics/:id/history
 * Get rubric version history
 */
router.get('/rubrics/:id/history', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await rubricService.getRubricHistory(id);
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
 * POST /api/admin/rubrics
 * Create new rubric
 */
router.post('/rubrics', async (req, res) => {
    try {
        const adminId = req.user?.id;
        const rubricData = req.body;
        if (!adminId) {
            return res.status(401).json({
                success: false,
                error: 'Unauthorized',
            });
        }
        const result = await rubricService.createRubric(rubricData, adminId);
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
 * PUT /api/admin/rubrics/:id
 * Update rubric (creates new version)
 */
router.put('/rubrics/:id', async (req, res) => {
    try {
        const adminId = req.user?.id;
        const { id } = req.params;
        const { updates, change_reason } = req.body;
        if (!adminId) {
            return res.status(401).json({
                success: false,
                error: 'Unauthorized',
            });
        }
        if (!change_reason) {
            return res.status(400).json({
                success: false,
                error: 'Validation error',
                message: 'change_reason is required',
            });
        }
        const result = await rubricService.updateRubric(id, updates, adminId, change_reason);
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
 * POST /api/admin/rubrics/:id/activate
 * Activate a rubric
 */
router.post('/rubrics/:id/activate', async (req, res) => {
    try {
        const adminId = req.user?.id;
        const { id } = req.params;
        if (!adminId) {
            return res.status(401).json({
                success: false,
                error: 'Unauthorized',
            });
        }
        const result = await rubricService.activateRubric(id, adminId);
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
 * POST /api/admin/rubrics/:id/deactivate
 * Deactivate a rubric
 */
router.post('/rubrics/:id/deactivate', async (req, res) => {
    try {
        const adminId = req.user?.id;
        const { id } = req.params;
        const { reason } = req.body;
        if (!adminId) {
            return res.status(401).json({
                success: false,
                error: 'Unauthorized',
            });
        }
        const result = await rubricService.deactivateRubric(id, adminId, reason);
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
//# sourceMappingURL=rubrics.js.map