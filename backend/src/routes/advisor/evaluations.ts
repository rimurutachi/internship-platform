import { Router } from 'express';
import { authenticateToken, requireRole, AuthRequest } from '../../middleware/auth';
import * as advisorEvaluationService from '../../services/advisorEvaluationService';

const router = Router();

/**
 * GET /api/advisor/evaluations/pending
 * Get all pending evaluations (submitted status)
 */
router.get('/evaluations/pending', async (req: AuthRequest, res) => {
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
  } catch (error: any) {
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
router.get('/evaluations/status/:status', async (req: AuthRequest, res) => {
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

    const result = await advisorEvaluationService.getEvaluationsByStatus(
      advisorId,
      status as any
    );

    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.status(200).json(result);
  } catch (error: any) {
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
router.get('/evaluations/:id/context', async (req: AuthRequest, res) => {
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
  } catch (error: any) {
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
router.get('/evaluations/statistics', async (req: AuthRequest, res) => {
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
  } catch (error: any) {
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
router.post('/evaluations/:id/approve', async (req: AuthRequest, res) => {
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

    const result = await advisorEvaluationService.approveEvaluation(
      id,
      advisorId,
      approvalData
    );

    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.status(200).json(result);
  } catch (error: any) {
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
router.post('/evaluations/:id/request-revision', async (req: AuthRequest, res) => {
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

    const result = await advisorEvaluationService.requestRevision(
      id,
      advisorId,
      revision_reason
    );

    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.status(200).json(result);
  } catch (error: any) {
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
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message,
    });
  }
});

export default router;
