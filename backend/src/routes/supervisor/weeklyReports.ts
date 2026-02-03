import { Router } from 'express';
import { authenticateToken, requireRole, AuthRequest } from '../../middleware/auth';
import * as supervisorReportsService from '../../services/supervisorReportsService';
import { ensureString } from '../../utils/typeGuards';

const router = Router();

// All routes require authentication and supervisor role
router.use(authenticateToken);
router.use(requireRole(['supervisor']));

/**
 * GET /api/supervisor/weekly-reports
 * Get all weekly reports for supervised internships
 */
router.get('/weekly-reports', async (req: AuthRequest, res) => {
  try {
    const supervisorId = req.user?.id;
    const { internship_id, student_id, status, week_number } = req.query;

    if (!supervisorId) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
      });
    }

    const filters: any = {};
    if (internship_id) filters.internship_id = internship_id as string;
    if (student_id) filters.student_id = student_id as string;
    if (status) filters.status = status as any;
    if (week_number) filters.week_number = parseInt(week_number as string, 10);

    const result = await supervisorReportsService.getStudentReports(supervisorId, filters);

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
 * GET /api/supervisor/weekly-reports/pending-count
 * Get count of pending reports
 */
router.get('/weekly-reports/pending-count', async (req: AuthRequest, res) => {
  try {
    const supervisorId = req.user?.id;

    if (!supervisorId) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
      });
    }

    const result = await supervisorReportsService.getPendingReportsCount(supervisorId);

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
 * GET /api/supervisor/weekly-reports/statistics
 * Get report statistics
 */
router.get('/weekly-reports/statistics', async (req: AuthRequest, res) => {
  try {
    const supervisorId = req.user?.id;

    if (!supervisorId) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
      });
    }

    const result = await supervisorReportsService.getReportStatistics(supervisorId);

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
 * GET /api/supervisor/weekly-reports/summary-by-student
 * Get reports summary grouped by student
 */
router.get('/weekly-reports/summary-by-student', async (req: AuthRequest, res) => {
  try {
    const supervisorId = req.user?.id;
    const { internship_id } = req.query;

    if (!supervisorId) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
      });
    }

    const result = await supervisorReportsService.getReportsSummaryByStudent(
      supervisorId,
      internship_id as string | undefined
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
 * POST /api/supervisor/weekly-reports/:id/approve
 * Approve a weekly report
 */
router.post('/weekly-reports/:id/approve', async (req: AuthRequest, res) => {
  try {
    const supervisorId = req.user?.id;
    const id = ensureString(req.params.id, 'id');
    const { comments } = req.body;

    if (!supervisorId) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
      });
    }

    const result = await supervisorReportsService.approveWeeklyReport(id, supervisorId, comments);

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
 * POST /api/supervisor/weekly-reports/:id/reject
 * Reject a weekly report
 */
router.post('/weekly-reports/:id/reject', async (req: AuthRequest, res) => {
  try {
    const supervisorId = req.user?.id;
    const id = ensureString(req.params.id, 'id');
    const { rejection_reason } = req.body;

    if (!supervisorId) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
      });
    }

    if (!rejection_reason) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        message: 'Rejection reason is required',
      });
    }

    const result = await supervisorReportsService.rejectWeeklyReport(id, supervisorId, rejection_reason);

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
 * POST /api/supervisor/weekly-reports/:id/comment
 * Add comment to a report without changing status
 */
router.post('/weekly-reports/:id/comment', async (req: AuthRequest, res) => {
  try {
    const supervisorId = req.user?.id;
    const id = ensureString(req.params.id, 'id');
    const { comment } = req.body;

    if (!supervisorId) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
      });
    }

    if (!comment) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        message: 'Comment is required',
      });
    }

    const result = await supervisorReportsService.addCommentToReport(id, supervisorId, comment);

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
