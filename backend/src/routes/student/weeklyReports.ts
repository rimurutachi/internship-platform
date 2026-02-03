import { Router } from 'express';
import { authenticateToken, requireRole, AuthRequest } from '../../middleware/auth';
import * as weeklyReportsService from '../../services/weeklyReportsService';
import { ensureString } from '../../utils/typeGuards';

const router = Router();

// All routes require authentication and student role
router.use(authenticateToken);
router.use(requireRole(['student']));

/**
 * GET /api/student/weekly-reports
 * Get all weekly reports for the authenticated student
 */
router.get('/weekly-reports', async (req: AuthRequest, res) => {
  try {
    const studentId = req.user?.id;
    const { internship_id } = req.query;

    if (!studentId) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
      });
    }

    const result = await weeklyReportsService.getMyWeeklyReports(
      studentId,
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
 * POST /api/student/weekly-reports
 * Create a new weekly report
 */
router.post('/weekly-reports', async (req: AuthRequest, res) => {
  try {
    const studentId = req.user?.id;
    const reportData = req.body;

    console.log('🔵 [Weekly Report] Create request received:', {
      studentId,
      internshipId: reportData.internship_id,
      weekNumber: reportData.week_number,
      accomplishmentsLength: reportData.accomplishments?.length || 0,
      hoursRendered: reportData.hours_rendered
    });

    if (!studentId) {
      console.error('❌ [Weekly Report] Unauthorized: No student ID in request');
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
      });
    }

    const result = await weeklyReportsService.createWeeklyReport(studentId, reportData);

    if (!result.success) {
      console.error('❌ [Weekly Report] Creation failed:', result.error);
      return res.status(400).json(result);
    }

    console.log('✅ [Weekly Report] Created successfully:', {
      reportId: result.data?.id,
      weekNumber: result.data?.week_number
    });

    return res.status(201).json(result);
  } catch (error: any) {
    console.error('❌ [Weekly Report] Server error:', error.message, error.stack);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message,
    });
  }
});

/**
 * GET /api/student/weekly-reports/:id
 * Get a specific weekly report
 */
router.get('/weekly-reports/:id', async (req: AuthRequest, res) => {
  try {
    const id = ensureString(req.params.id, 'id');

    const result = await weeklyReportsService.getWeeklyReportById(id);

    if (!result.success) {
      return res.status(404).json(result);
    }

    // Verify ownership
    if (result.data.student_id !== req.user?.id) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: 'You can only view your own reports',
      });
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
 * PUT /api/student/weekly-reports/:id
 * Update a weekly report (only if pending or rejected)
 */
router.put('/weekly-reports/:id', async (req: AuthRequest, res) => {
  try {
    const studentId = req.user?.id;
    const id = ensureString(req.params.id, 'id');
    const updates = req.body;

    if (!studentId) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
      });
    }

    const result = await weeklyReportsService.updateWeeklyReport(id, studentId, updates);

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
 * DELETE /api/student/weekly-reports/:id
 * Delete a weekly report (only if pending)
 */
router.delete('/weekly-reports/:id', async (req: AuthRequest, res) => {
  try {
    const studentId = req.user?.id;
    const id = ensureString(req.params.id, 'id');

    if (!studentId) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
      });
    }

    const result = await weeklyReportsService.deleteWeeklyReport(id, studentId);

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
 * GET /api/student/weekly-reports/next-deadline
 * Get next report deadline for student
 */
router.get('/weekly-reports/deadline/:internship_id', async (req: AuthRequest, res) => {
  try {
    const studentId = req.user?.id;
    const internship_id = ensureString(req.params.internship_id, 'internship_id');

    if (!studentId) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
      });
    }

    const result = await weeklyReportsService.getNextReportDeadline(studentId, internship_id);

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
