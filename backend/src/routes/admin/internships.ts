import { Router } from 'express';
import { internshipsController } from '../../controllers/admin/internshipsController';
import { authenticateToken, requireRole } from '../../middleware/auth';

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

export default router;
