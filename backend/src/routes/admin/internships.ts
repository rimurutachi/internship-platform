import { Router } from 'express';
import { internshipsController } from '../../controllers/admin/internshipsController';
import { authenticateToken, requireRole } from '../../middleware/auth';
import InternshipsEnhancedController from '../../controllers/admin/internshipsEnhancedController';

const router = Router();

// Apply authentication and admin role check to all routes
router.use(authenticateToken);
router.use(requireRole(['admin']));

/**
 * GET /admin/internships
 * Get all internships with filters and pagination
 * Query params: page, limit, status, university_id, company_id, search
 */
router.get('/', internshipsController.getInternships.bind(internshipsController));

/**
 * GET /admin/internships/stats/summary
 * Get internships summary statistics
 */
router.get('/stats/summary', internshipsController.getInternshipStats.bind(internshipsController));

/**
 * GET /admin/internships/available-students
 * Get students without active internships
 */
router.get('/available-students', internshipsController.getAvailableStudents.bind(internshipsController));

/**
 * GET /admin/internships/advisors-by-university/:university_id
 * Get advisors for specific university
 */
router.get('/advisors-by-university/:university_id', internshipsController.getAdvisorsByUniversity.bind(internshipsController));

/**
 * GET /admin/internships/supervisors-by-company/:company_id
 * Get supervisors for specific company
 */
router.get('/supervisors-by-company/:company_id', internshipsController.getSupervisorsByCompany.bind(internshipsController));

/**
 * GET /admin/internships/:id
 * Get single internship with activity log
 */
router.get('/:id', internshipsController.getInternship.bind(internshipsController));

/**
 * GET /admin/internships/:id/activity-log
 * Get activity log for specific internship
 */
router.get('/:id/activity-log', internshipsController.getInternshipActivityLog.bind(internshipsController));

/**
 * POST /admin/internships
 * Create new internship
 * Body: { student_id, company_id, position, advisor_id, supervisor_id, start_date, end_date, status }
 */
router.post('/', internshipsController.createInternship.bind(internshipsController));

/**
 * PATCH /admin/internships/:id
 * Update internship (cannot change student or company)
 * Body: { position, advisor_id, supervisor_id, start_date, end_date, status }
 */
router.patch('/:id', internshipsController.updateInternship.bind(internshipsController));

/**
 * DELETE /admin/internships/:id
 * Cancel internship (soft delete)
 */
router.delete('/:id', internshipsController.deleteInternship.bind(internshipsController));

/**
 * POST /admin/internships/:id/archive
 * Archive internship (preserve data)
 */
router.post('/:id/archive', internshipsController.archiveInternship.bind(internshipsController));

/**
 * POST /admin/internships/:id/unarchive
 * Unarchive internship (restore)
 */
router.post('/:id/unarchive', internshipsController.unarchiveInternship.bind(internshipsController));

// ============================================================
// ENHANCED FEATURES (v2.0) - Reminder & Capacity Management
// All enhanced routes are prefixed with /enhanced
// ============================================================

/**
 * GET /admin/internships/enhanced/reminders/:internship_id
 * Get all reminders for an internship
 */
router.get('/enhanced/reminders/:internship_id', InternshipsEnhancedController.getReminders);

/**
 * POST /admin/internships/enhanced/reminders
 * Create a new reminder
 */
router.post('/enhanced/reminders', InternshipsEnhancedController.createReminder);

/**
 * PATCH /admin/internships/enhanced/reminders/:reminder_id
 * Update an existing reminder
 */
router.patch('/enhanced/reminders/:reminder_id', InternshipsEnhancedController.updateReminder);

/**
 * DELETE /admin/internships/enhanced/reminders/:reminder_id
 * Delete a reminder
 */
router.delete('/enhanced/reminders/:reminder_id', InternshipsEnhancedController.deleteReminder);

/**
 * POST /admin/internships/enhanced/reminders/:reminder_id/send
 * Send immediate reminder
 */
router.post('/enhanced/reminders/:reminder_id/send', InternshipsEnhancedController.sendReminder);

/**
 * POST /admin/internships/enhanced/reminders/bulk-send
 * Bulk send reminders
 */
router.post('/enhanced/reminders/bulk-send', InternshipsEnhancedController.bulkSendReminders);

/**
 * GET /admin/internships/enhanced/capacity/overview
 * Get company capacity overview
 */
router.get('/enhanced/capacity/overview', InternshipsEnhancedController.getCapacityOverview);

/**
 * POST /admin/internships/enhanced/capacity/validate
 * Validate company capacity
 */
router.post('/enhanced/capacity/validate', InternshipsEnhancedController.validateCapacity);

/**
 * GET /admin/internships/enhanced/documents/:internship_id
 * Get document submission status for internship
 */
router.get('/enhanced/documents/:internship_id', InternshipsEnhancedController.getDocumentStatus);

/**
 * GET /admin/internships/enhanced/documents/completion-rate
 * Get document completion rate
 */
router.get('/enhanced/documents/completion-rate', InternshipsEnhancedController.getDocumentCompletionRate);

/**
 * POST /admin/internships/enhanced/bulk/update-status
 * Update status for multiple internships
 */
router.post('/enhanced/bulk/update-status', InternshipsEnhancedController.bulkUpdateStatus);

/**
 * POST /admin/internships/enhanced/bulk/export
 * Export internships data
 */
router.post('/enhanced/bulk/export', InternshipsEnhancedController.prepareExport);

/**
 * POST /admin/internships/enhanced/analytics/generate-report
 * Generate report for internships
 */
router.post('/enhanced/analytics/generate-report', InternshipsEnhancedController.generateReport);

/**
 * GET /admin/internships/enhanced/analytics/deadline-tracking
 * Get deadline tracking analytics
 */
router.get('/enhanced/analytics/deadline-tracking', InternshipsEnhancedController.getDeadlineTracking);

export default router;
