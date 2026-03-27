import { Router } from 'express';
import { authenticateToken, requireRole, AuthRequest } from '../../middleware/auth';
import * as dailyReportsService from '../../services/dailyReportsService';
import { ensureString } from '../../utils/typeGuards';

const router = Router();

// All routes require authentication and student role
router.use(authenticateToken);
router.use(requireRole(['student']));

/**
 * GET /api/student/daily-reports
 * Get all daily reports for the authenticated student
 * Query: internship_id, start_date, end_date
 */
router.get('/daily-reports', async (req: AuthRequest, res) => {
  try {
    const studentId = req.user?.id;
    const { internship_id, start_date, end_date } = req.query;

    if (!studentId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const result = await dailyReportsService.getMyDailyReports(
      studentId,
      internship_id as string | undefined,
      {
        start_date: start_date as string | undefined,
        end_date: end_date as string | undefined,
      }
    );

    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.status(200).json(result);
  } catch (error: any) {
    return res.status(500).json({ success: false, error: 'Internal server error', message: error.message });
  }
});

/**
 * POST /api/student/daily-reports
 * Create a new daily report
 */
router.post('/daily-reports', async (req: AuthRequest, res) => {
  try {
    const studentId = req.user?.id;
    const reportData = req.body;

    console.log('🔵 [Daily Report] Create request:', {
      studentId,
      internshipId: reportData.internship_id,
      date: reportData.report_date,
      hoursWorked: reportData.hours_worked,
    });

    if (!studentId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const result = await dailyReportsService.createDailyReport(studentId, reportData);

    if (!result.success) {
      return res.status(400).json(result);
    }

    console.log('✅ [Daily Report] Created:', result.data?.id);
    return res.status(201).json(result);
  } catch (error: any) {
    return res.status(500).json({ success: false, error: 'Internal server error', message: error.message });
  }
});

/**
 * GET /api/student/daily-reports/:id
 * Get a specific daily report
 */
router.get('/daily-reports/:id', async (req: AuthRequest, res) => {
  try {
    const studentId = req.user?.id;
    const id = ensureString(req.params.id, 'id');

    if (!studentId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const result = await dailyReportsService.getDailyReportById(id, studentId);

    if (!result.success) {
      return res.status(404).json(result);
    }

    return res.status(200).json(result);
  } catch (error: any) {
    return res.status(500).json({ success: false, error: 'Internal server error', message: error.message });
  }
});

/**
 * PUT /api/student/daily-reports/:id
 * Update a daily report
 */
router.put('/daily-reports/:id', async (req: AuthRequest, res) => {
  try {
    const studentId = req.user?.id;
    const id = ensureString(req.params.id, 'id');
    const updates = req.body;

    if (!studentId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const result = await dailyReportsService.updateDailyReport(id, studentId, updates);

    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.status(200).json(result);
  } catch (error: any) {
    return res.status(500).json({ success: false, error: 'Internal server error', message: error.message });
  }
});

/**
 * DELETE /api/student/daily-reports/:id
 * Delete a daily report
 */
router.delete('/daily-reports/:id', async (req: AuthRequest, res) => {
  try {
    const studentId = req.user?.id;
    const id = ensureString(req.params.id, 'id');

    if (!studentId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const result = await dailyReportsService.deleteDailyReport(id, studentId);

    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.status(200).json(result);
  } catch (error: any) {
    return res.status(500).json({ success: false, error: 'Internal server error', message: error.message });
  }
});

export default router;
