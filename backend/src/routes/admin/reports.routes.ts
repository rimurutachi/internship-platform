import { Router } from 'express';
import ReportsController from '../../controllers/admin/reportsController';

const router = Router();

router.get('/overview', ReportsController.getOverview);
router.get('/monthly-stats', ReportsController.getMonthlyStats);
router.get('/user-growth', ReportsController.getUserGrowth);
router.get('/internship-status', ReportsController.getInternshipStatus);
router.get('/evaluation-metrics', ReportsController.getEvaluationMetrics);
router.get('/performance', ReportsController.getPerformance);
router.get('/activity-timeline', ReportsController.getActivityTimeline);
router.get('/trends/:metric', ReportsController.getMetricTrend);
router.post('/export', ReportsController.exportReport);

export default router;
