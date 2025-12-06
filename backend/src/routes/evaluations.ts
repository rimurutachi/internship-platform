import { Router } from "express";
import { authenticateToken, requireRole } from "../middleware/auth";
import * as evaluationController from '../controllers/evaluationController';

const router = Router();

router.use(authenticateToken);

// Get evaluations with filters (must be before /:id)
router.get('/', evaluationController.getEvaluations);

// Analyze draft evaluation (supervisor) - MUST be before /:id routes
router.post('/analyze-draft',
    requireRole(['supervisor']),
    evaluationController.analyzeDraftEvaluation
);

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