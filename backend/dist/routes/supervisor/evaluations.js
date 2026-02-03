"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../../middleware/auth");
const evaluationController_1 = require("../../controllers/supervisor/evaluationController");
const router = (0, express_1.Router)();
// All routes require authentication and supervisor role
router.use(auth_1.authenticateToken);
router.use((0, auth_1.requireRole)(['supervisor']));
/**
 * POST /api/supervisor/evaluations
 * Create a new final evaluation (draft)
 */
router.post('/evaluations', evaluationController_1.createFinalEvaluation);
/**
 * GET /api/supervisor/evaluations/:id
 * Get a specific evaluation
 */
router.get('/evaluations/:id', evaluationController_1.getEvaluationById);
/**
 * GET /api/supervisor/evaluations/internship/:internship_id
 * Get evaluations by internship
 */
router.get('/evaluations/internship/:internship_id', evaluationController_1.getEvaluationsByInternship);
/**
 * PUT /api/supervisor/evaluations/:id
 * Save evaluation draft (auto-save)
 */
router.put('/evaluations/:id', evaluationController_1.saveFinalEvaluationDraft);
/**
 * POST /api/supervisor/evaluations/:id/submit
 * Submit evaluation to advisor for review
 */
router.post('/evaluations/:id/submit', evaluationController_1.submitFinalEvaluation);
/**
 * DELETE /api/supervisor/evaluations/:id
 * Delete evaluation draft
 */
router.delete('/evaluations/:id', evaluationController_1.deleteEvaluationDraft);
exports.default = router;
//# sourceMappingURL=evaluations.js.map