"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const internshipsController_1 = require("../../controllers/admin/internshipsController");
const auth_1 = require("../../middleware/auth");
const internshipsEnhancedController_1 = __importDefault(require("../../controllers/admin/internshipsEnhancedController"));
const router = (0, express_1.Router)();
// Apply authentication and admin role check to all routes
router.use(auth_1.authenticateToken);
router.use((0, auth_1.requireRole)(['admin']));
/**
 * GET /admin/internships
 * Get all internships with filters and pagination
 * Query params: page, limit, status, university_id, company_id, search
 */
router.get('/', internshipsController_1.internshipsController.getInternships.bind(internshipsController_1.internshipsController));
/**
 * GET /admin/internships/stats/summary
 * Get internships summary statistics
 */
router.get('/stats/summary', internshipsController_1.internshipsController.getInternshipStats.bind(internshipsController_1.internshipsController));
/**
 * GET /admin/internships/available-students
 * Get students without active internships
 */
router.get('/available-students', internshipsController_1.internshipsController.getAvailableStudents.bind(internshipsController_1.internshipsController));
/**
 * GET /admin/internships/advisors-by-university/:university_id
 * Get advisors for specific university
 */
router.get('/advisors-by-university/:university_id', internshipsController_1.internshipsController.getAdvisorsByUniversity.bind(internshipsController_1.internshipsController));
/**
 * GET /admin/internships/supervisors-by-company/:company_id
 * Get supervisors for specific company
 */
router.get('/supervisors-by-company/:company_id', internshipsController_1.internshipsController.getSupervisorsByCompany.bind(internshipsController_1.internshipsController));
/**
 * GET /admin/internships/:id
 * Get single internship with activity log
 */
router.get('/:id', internshipsController_1.internshipsController.getInternship.bind(internshipsController_1.internshipsController));
/**
 * GET /admin/internships/:id/activity-log
 * Get activity log for specific internship
 */
router.get('/:id/activity-log', internshipsController_1.internshipsController.getInternshipActivityLog.bind(internshipsController_1.internshipsController));
/**
 * POST /admin/internships
 * Create new internship
 * Body: { student_id, company_id, position, advisor_id, supervisor_id, start_date, end_date, status }
 */
router.post('/', internshipsController_1.internshipsController.createInternship.bind(internshipsController_1.internshipsController));
/**
 * PATCH /admin/internships/:id
 * Update internship (cannot change student or company)
 * Body: { position, advisor_id, supervisor_id, start_date, end_date, status }
 */
router.patch('/:id', internshipsController_1.internshipsController.updateInternship.bind(internshipsController_1.internshipsController));
/**
 * DELETE /admin/internships/:id
 * Cancel internship (soft delete)
 */
router.delete('/:id', internshipsController_1.internshipsController.deleteInternship.bind(internshipsController_1.internshipsController));
// ============================================================
// ENHANCED FEATURES (v2.0) - Reminder & Capacity Management
// All enhanced routes are prefixed with /enhanced
// ============================================================
/**
 * GET /admin/internships/enhanced/reminders/:internship_id
 * Get all reminders for an internship
 */
router.get('/enhanced/reminders/:internship_id', internshipsEnhancedController_1.default.getReminders);
/**
 * POST /admin/internships/enhanced/reminders
 * Create a new reminder
 */
router.post('/enhanced/reminders', internshipsEnhancedController_1.default.createReminder);
/**
 * PATCH /admin/internships/enhanced/reminders/:reminder_id
 * Update an existing reminder
 */
router.patch('/enhanced/reminders/:reminder_id', internshipsEnhancedController_1.default.updateReminder);
/**
 * DELETE /admin/internships/enhanced/reminders/:reminder_id
 * Delete a reminder
 */
router.delete('/enhanced/reminders/:reminder_id', internshipsEnhancedController_1.default.deleteReminder);
/**
 * POST /admin/internships/enhanced/reminders/:reminder_id/send
 * Send immediate reminder
 */
router.post('/enhanced/reminders/:reminder_id/send', internshipsEnhancedController_1.default.sendReminder);
/**
 * POST /admin/internships/enhanced/reminders/bulk-send
 * Bulk send reminders
 */
router.post('/enhanced/reminders/bulk-send', internshipsEnhancedController_1.default.bulkSendReminders);
/**
 * GET /admin/internships/enhanced/capacity/overview
 * Get company capacity overview
 */
router.get('/enhanced/capacity/overview', internshipsEnhancedController_1.default.getCapacityOverview);
/**
 * POST /admin/internships/enhanced/capacity/validate
 * Validate company capacity
 */
router.post('/enhanced/capacity/validate', internshipsEnhancedController_1.default.validateCapacity);
/**
 * GET /admin/internships/enhanced/documents/:internship_id
 * Get document submission status for internship
 */
router.get('/enhanced/documents/:internship_id', internshipsEnhancedController_1.default.getDocumentStatus);
/**
 * GET /admin/internships/enhanced/documents/completion-rate
 * Get document completion rate
 */
router.get('/enhanced/documents/completion-rate', internshipsEnhancedController_1.default.getDocumentCompletionRate);
/**
 * POST /admin/internships/enhanced/bulk/update-status
 * Update status for multiple internships
 */
router.post('/enhanced/bulk/update-status', internshipsEnhancedController_1.default.bulkUpdateStatus);
/**
 * POST /admin/internships/enhanced/bulk/export
 * Export internships data
 */
router.post('/enhanced/bulk/export', internshipsEnhancedController_1.default.prepareExport);
/**
 * POST /admin/internships/enhanced/analytics/generate-report
 * Generate report for internships
 */
router.post('/enhanced/analytics/generate-report', internshipsEnhancedController_1.default.generateReport);
/**
 * GET /admin/internships/enhanced/analytics/deadline-tracking
 * Get deadline tracking analytics
 */
router.get('/enhanced/analytics/deadline-tracking', internshipsEnhancedController_1.default.getDeadlineTracking);
exports.default = router;
//# sourceMappingURL=internships.js.map