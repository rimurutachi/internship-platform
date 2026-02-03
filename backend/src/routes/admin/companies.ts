import { Router } from 'express';
import { authenticateToken, requireRole } from '../../middleware/auth';
import {
  getCompanies,
  getCompany,
  createCompany,
  updateCompany,
  deleteCompany,
  getCompanyStats,
  getCompanySupervisors,
  archiveCompany,
  updateCompanyStudentsCount,
  unarchiveCompany,
  assignSupervisorToCompany,
  removeSupervisorFromCompany,
  getAllSupervisors,
} from '../../controllers/admin/companiesController';

const router = Router();

// Apply auth middleware and admin role requirement to all routes
router.use(authenticateToken);
router.use(requireRole(['admin']));

/**
 * GET /api/admin/companies
 * Get all companies with pagination and filters
 * Query params: page, limit, search, is_verified
 */
router.get('/', getCompanies);

/**
 * GET /api/admin/companies/stats
 * Get company statistics
 */
router.get('/stats', getCompanyStats);

/**
 * GET /api/admin/companies/all-supervisors
 * Get all supervisors (optionally filter by unassigned)
 * Query params: unassigned (boolean) - if true, only return supervisors without a company
 */
router.get('/all-supervisors', getAllSupervisors);

/**
 * GET /api/admin/companies/:id
 * Get single company by ID
 */
router.get('/:id', getCompany);

/**
 * GET /api/admin/companies/:id/supervisors
 * Get supervisors for a specific company
 */
router.get('/:id/supervisors', getCompanySupervisors);

/**
 * POST /api/admin/companies/:id/supervisors
 * Assign a supervisor to a company
 * Body: { supervisor_id: string }
 */
router.post('/:id/supervisors', assignSupervisorToCompany);

/**
 * DELETE /api/admin/companies/:id/supervisors/:supervisor_id
 * Remove a supervisor from a company
 */
router.delete('/:id/supervisors/:supervisor_id', removeSupervisorFromCompany);

/**
 * POST /api/admin/companies
 * Create new company
 * Body: { name, industry?, address?, contact_info?, code?, capacity_limit?, is_verified?, is_moa_standardized? }
 */
router.post('/', createCompany);

/**
 * PATCH /api/admin/companies/:id
 * Update company
 * Body: { name?, industry?, address?, contact_info?, code?, capacity_limit?, is_verified?, is_moa_standardized? }
 */
router.patch('/:id', updateCompany);

/**
 * POST /api/admin/companies/:id/archive
 * Archive company (soft delete)
 */
router.post('/:id/archive', archiveCompany);

/**
 * POST /api/admin/companies/:id/unarchive
 * Unarchive company (restore)
 */
router.post('/:id/unarchive', unarchiveCompany);

/**
 * GET /api/admin/companies/:id/students-count
 * Update and get current students count
 */
router.get('/:id/students-count', updateCompanyStudentsCount);

/**
 * DELETE /api/admin/companies/:id
 * Delete company (checks for active internships and supervisors first)
 */
router.delete('/:id', deleteCompany);

export default router;
