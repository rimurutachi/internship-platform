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
//# sourceMappingURL=companiesController.d.ts.map