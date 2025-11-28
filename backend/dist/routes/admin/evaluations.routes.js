"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const evaluationsController_1 = require("../../controllers/admin/evaluationsController");
const auth_1 = require("../../middleware/auth");
const router = (0, express_1.Router)();
const evaluationsController = new evaluationsController_1.EvaluationsController();
// All routes require admin authentication
router.use(auth_1.authenticateToken);
router.use((0, auth_1.requireRole)(['admin']));
// Get all evaluations with filters
router.get('/', evaluationsController.getEvaluations);
// Get quality metrics
router.get('/metrics/quality', evaluationsController.getQualityMetrics);
// Get metrics by supervisor
router.get('/metrics/by-supervisor', evaluationsController.getMetricsBySupervisor);
// Get metrics by company
router.get('/metrics/by-company', evaluationsController.getMetricsByCompany);
// Bulk operations
router.post('/bulk-approve', evaluationsController.bulkApprove);
router.post('/bulk-export', evaluationsController.bulkExport);
// Get single evaluation
router.get('/:id', evaluationsController.getEvaluation);
// Get AI results for evaluation
router.get('/:id/ai-results', evaluationsController.getAIResults);
// Validate AI results
router.patch('/:id/validate-sentiment', evaluationsController.validateSentiment);
router.patch('/:id/validate-features', evaluationsController.validateFeatures);
router.patch('/:id/validate-bias', evaluationsController.validateBias);
// Evaluation actions
router.post('/:id/approve', evaluationsController.approveEvaluation);
router.post('/:id/override-grade', evaluationsController.overrideGrade);
router.post('/:id/reject', evaluationsController.rejectEvaluation);
router.post('/:id/request-reprocess', evaluationsController.requestReprocess);
exports.default = router;
//# sourceMappingURL=evaluations.routes.js.map