import { Request, Response } from 'express';
export declare class InternshipsController {
    /**
     * GET /admin/internships
     * Get all internships with filters and pagination
     */
    getInternships(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * GET /admin/internships/:id
     * Get single internship with activity log
     */
    getInternship(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * POST /admin/internships
     * Create new internship with validation
     */
    createInternship(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * PATCH /admin/internships/:id
     * Update internship (cannot change student or company)
     */
    updateInternship(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * DELETE /admin/internships/:id
     * Cancel internship (soft delete)
     */
    deleteInternship(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * POST /admin/internships/:id/archive
     * Archive an internship (soft delete)
     */
    archiveInternship(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    /**
     * POST /admin/internships/:id/unarchive
     * Unarchive an internship (restore)
     */
    unarchiveInternship(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    /**
     * GET /admin/internships/available-students
     * Get students without active internships
     */
    getAvailableStudents(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * GET /admin/internships/advisors-by-university/:university_id
     * Get advisors for specific university
     */
    getAdvisorsByUniversity(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * GET /admin/internships/supervisors-by-company/:company_id
     * Get supervisors for specific company
     */
    getSupervisorsByCompany(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * GET /admin/internships/:id/activity-log
     * Get activity log for specific internship
     */
    getInternshipActivityLog(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * GET /admin/internships/stats/summary
     * Get internships summary statistics
     */
    getInternshipStats(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
}
export declare const internshipsController: InternshipsController;
//# sourceMappingURL=internshipsController.d.ts.map