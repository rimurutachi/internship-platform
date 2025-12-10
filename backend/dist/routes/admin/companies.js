"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../../middleware/auth");
const companiesController_1 = require("../../controllers/admin/companiesController");
const router = (0, express_1.Router)();
// Apply auth middleware and admin role requirement to all routes
router.use(auth_1.authenticateToken);
router.use((0, auth_1.requireRole)(['admin']));
/**
 * GET /api/admin/companies
 * Get all companies with pagination and filters
 * Query params: page, limit, search, is_verified
 */
router.get('/', companiesController_1.getCompanies);
/**
 * GET /api/admin/companies/stats
 * Get company statistics
 */
router.get('/stats', companiesController_1.getCompanyStats);
/**
 * GET /api/admin/companies/:id
 * Get single company by ID
 */
router.get('/:id', companiesController_1.getCompany);
/**
 * GET /api/admin/companies/:id/supervisors
 * Get supervisors for a specific company
 */
router.get('/:id/supervisors', companiesController_1.getCompanySupervisors);
/**
 * POST /api/admin/companies
 * Create new company
 * Body: { name, industry?, address?, contact_info?, code?, capacity_limit?, is_verified?, is_moa_standardized? }
 */
router.post('/', companiesController_1.createCompany);
/**
 * PATCH /api/admin/companies/:id
 * Update company
 * Body: { name?, industry?, address?, contact_info?, code?, capacity_limit?, is_verified?, is_moa_standardized? }
 */
router.patch('/:id', companiesController_1.updateCompany);
/**
 * POST /api/admin/companies/:id/archive
 * Archive company (soft delete)
 */
router.post('/:id/archive', companiesController_1.archiveCompany);
/**
 * POST /api/admin/companies/:id/unarchive
 * Unarchive company (restore)
 */
router.post('/:id/unarchive', companiesController_1.unarchiveCompany);
/**
 * GET /api/admin/companies/:id/students-count
 * Update and get current students count
 */
router.get('/:id/students-count', companiesController_1.updateCompanyStudentsCount);
/**
 * DELETE /api/admin/companies/:id
 * Delete company (checks for active internships and supervisors first)
 */
router.delete('/:id', companiesController_1.deleteCompany);
exports.default = router;
//# sourceMappingURL=companies.js.map