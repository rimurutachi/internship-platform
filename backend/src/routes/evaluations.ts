import { Router } from "express";
import { authenticateToken, requireRole } from "../middleware/auth";
import * as evaluationController from '../controllers/evaluationController';

const router = Router();

router.use(authenticateToken);

// Get evaluations with filters (must be before /:id)
router.get('/', evaluationController.getEvaluations);

// Get overdue evaluations (must be before /:id)
router.get('/overdue', evaluationController.getOverdueEvaluations);

// Get evaluation timeline for an internship (must be before /:id)
router.get('/timeline/:internshipId', evaluationController.getEvaluationTimeline);

// Get evaluation progress summary (must be before /:id)
router.get('/progress/:internshipId', evaluationController.getEvaluationProgress);

// Get evaluations by type for an internship (must be before /:id)
router.get('/internship/:internshipId/type/:evaluationType', evaluationController.getEvaluationsByType);

// NOTE: POST /analyze-draft route removed in v2.0.0
// AI is now used only for historical trend analysis (admin analytics)

// Create evaluation (supervisor)
router.post('/',
    requireRole(['supervisor']),
    evaluationController.createEvaluation
);

// Get evaluation
router.get('/:id', evaluationController.getEvaluation);

// Update evaluation (supervisor, draft only)
router.put('/:id',
    requireRole(['supervisor']),
    evaluationController.updateEvaluation
);

// Submit evaluation for AI Processing
router.post('/:id/submit',
    requireRole(['supervisor']),
    evaluationController.submitEvaluation
);

// Approve evaluation (advisor)
router.post('/:id/approve',
    requireRole(['advisor']),
    evaluationController.approveEvaluation
);

// Get evaluation for internship
router.get('/internship/:internshipId', evaluationController.getInternshipEvaluations);

export default router;