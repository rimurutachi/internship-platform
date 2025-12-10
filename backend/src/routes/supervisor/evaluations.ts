import { Router } from 'express';
import { authenticateToken, requireRole } from '../../middleware/auth';
import {
  createFinalEvaluation,
  saveFinalEvaluationDraft,
  submitFinalEvaluation,
  getEvaluationById,
  getEvaluationsByInternship,
  deleteEvaluationDraft,
} from '../../controllers/supervisor/evaluationController';

const router = Router();

// All routes require authentication and supervisor role
router.use(authenticateToken);
router.use(requireRole(['supervisor']));

/**
 * POST /api/supervisor/evaluations
 * Create a new final evaluation (draft)
 */
router.post('/evaluations', createFinalEvaluation);

/**
 * GET /api/supervisor/evaluations/:id
 * Get a specific evaluation
 */
router.get('/evaluations/:id', getEvaluationById);

/**
 * GET /api/supervisor/evaluations/internship/:internship_id
 * Get evaluations by internship
 */
router.get('/evaluations/internship/:internship_id', getEvaluationsByInternship);

/**
 * PUT /api/supervisor/evaluations/:id
 * Save evaluation draft (auto-save)
 */
router.put('/evaluations/:id', saveFinalEvaluationDraft);

/**
 * POST /api/supervisor/evaluations/:id/submit
 * Submit evaluation to advisor for review
 */
router.post('/evaluations/:id/submit', submitFinalEvaluation);

/**
 * DELETE /api/supervisor/evaluations/:id
 * Delete evaluation draft
 */
router.delete('/evaluations/:id', deleteEvaluationDraft);

export default router;
