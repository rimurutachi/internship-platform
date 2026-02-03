import { Router } from 'express';
import { authenticateToken, requireRole, AuthRequest } from '../../middleware/auth';
import { fetchWeeklyReports } from '../../services/adminWeeklyReportsService';

const router = Router();

router.use(authenticateToken);
router.use(requireRole(['admin']));

// GET /api/admin/weekly-reports
router.get('/', async (req: AuthRequest, res) => {
  try {
    const { status } = req.query as { status?: string };

    const result = await fetchWeeklyReports(status);

    return res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch weekly reports',
      message: error.message,
    });
  }
});

export default router;
