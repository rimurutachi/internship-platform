import { Request, Response } from 'express';
/**
 * Get all companies with pagination and filters
 * GET /admin/companies?page=1&limit=20&search=tech&is_verified=true
 */
export declare function getCompanies(req: Request, res: Response): Promise<void>;
/**
 * Get single company by ID
 * GET /admin/companies/:id
 */
export declare function getCompany(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
/**
 * Create new company
 * POST /admin/companies
 * Body: { name, industry?, address?, contact_info?, code?, capacity_limit?, is_verified?, is_moa_standardized? }
 */
export declare function createCompany(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
/**
 * Update company
 * PATCH /admin/companies/:id
 * Body: { name?, industry?, address?, contact_info?, code?, capacity_limit?, is_verified?, is_moa_standardized? }
 */
export declare function updateCompany(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
/**
 * Delete company
 * DELETE /admin/companies/:id
 */
export declare function deleteCompany(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
/**
 * Get company statistics
 * GET /admin/companies/stats
 */
export declare function getCompanyStats(req: Request, res: Response): Promise<void>;
/**
 * Get supervisors for a specific company
 * GET /admin/companies/:id/supervisors
 */
export declare function getCompanySupervisors(req: Request, res: Response): Promise<void>;
/**
 * Archive a company (soft delete)
 * POST /admin/companies/:id/archive
 */
export declare function archiveCompany(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
/**
 * Unarchive a company (restore from archive)
 * POST /admin/companies/:id/unarchive
 */
export declare function unarchiveCompany(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
/**
 * Get current students count for a company
 * This updates the current_students field based on active internships
 * GET /admin/companies/:id/students-count
 */
export declare function updateCompanyStudentsCount(req: Request, res: Response): Promise<void>;
/**
 * Assign a supervisor to a company
 * POST /admin/companies/:id/supervisors
 * Body: { supervisor_id: string }
 */
export declare function assignSupervisorToCompany(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
/**
 * Remove a supervisor from a company
 * DELETE /admin/companies/:id/supervisors/:supervisor_id
 */
export declare function removeSupervisorFromCompany(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
/**
 * Get all supervisors (optionally filter by unassigned)
 * GET /admin/companies/all-supervisors
 * Query params: unassigned (boolean) - if true, only return supervisors without a company
 */
export declare function getAllSupervisors(req: Request, res: Response): Promise<void>;
//# sourceMappingURL=companiesController.d.ts.map