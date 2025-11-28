import { Router } from 'express';
import InternshipsEnhancedController from '../../controllers/admin/internshipsEnhancedController';
import { authenticateToken } from '../../middleware/auth';

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Reminder management routes
router.get('/reminders/:internship_id', InternshipsEnhancedController.getReminders);
router.post('/:internship_id/reminders', InternshipsEnhancedController.createReminder);
router.patch('/reminders/:reminder_id', InternshipsEnhancedController.updateReminder);
router.delete('/reminders/:reminder_id', InternshipsEnhancedController.deleteReminder);
router.post('/:internship_id/send-reminder', InternshipsEnhancedController.sendReminder);

// Company capacity routes
router.get('/companies/capacity-overview', InternshipsEnhancedController.getCapacityOverview);
router.patch('/companies/:company_id/capacity', InternshipsEnhancedController.updateCompanyCapacity);

// Document tracking routes
router.get('/:internship_id/documents-status', InternshipsEnhancedController.getDocumentStatus);

// Bulk operations routes
router.get('/bulk/prepare-export', InternshipsEnhancedController.prepareExport);
router.post('/bulk/send-reminders', InternshipsEnhancedController.bulkSendReminders);
router.post('/bulk/update-status', InternshipsEnhancedController.bulkUpdateStatus);
router.post('/generate-report', InternshipsEnhancedController.generateReport);

// Analytics routes
router.get('/analytics/capacity-distribution', InternshipsEnhancedController.getCapacityAnalytics);
router.get('/analytics/document-submission-rate', InternshipsEnhancedController.getDocumentSubmissionRate);

export default router;
