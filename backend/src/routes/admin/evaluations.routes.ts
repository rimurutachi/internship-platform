import { Router } from 'express';
import { EvaluationsController } from '../../controllers/admin/evaluationsController';
import { authenticateToken, requireRole } from '../../middleware/auth';

const router = Router();
const evaluationsController = new EvaluationsController();

// All routes require admin authentication
router.use(authenticateToken);
router.use(requireRole(['admin']));

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

export default router;
