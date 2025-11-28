import { Request, Response } from 'express';
export declare class InternshipsEnhancedController {
    /**
     * GET /admin/internships/reminders/:internship_id
     * Get all reminders for an internship
     */
    static getReminders(req: Request, res: Response): Promise<void>;
    /**
     * POST /admin/internships/:internship_id/reminders
     * Create a new reminder for an internship
     */
    static createReminder(req: Request, res: Response): Promise<void>;
    /**
     * PATCH /admin/internships/reminders/:reminder_id
     * Update an existing reminder
     */
    static updateReminder(req: Request, res: Response): Promise<void>;
    /**
     * DELETE /admin/internships/reminders/:reminder_id
     * Delete a reminder
     */
    static deleteReminder(req: Request, res: Response): Promise<void>;
    /**
     * POST /admin/internships/:internship_id/send-reminder
     * Send immediate reminder (not scheduled)
     */
    static sendReminder(req: Request, res: Response): Promise<void>;
    /**
     * GET /admin/companies/capacity-overview
     * Get company capacity overview
     */
    static getCapacityOverview(req: Request, res: Response): Promise<void>;
    /**
     * PATCH /admin/companies/:company_id/capacity
     * Update company capacity settings
     */
    static updateCompanyCapacity(req: Request, res: Response): Promise<void>;
    /**
     * GET /admin/internships/:internship_id/documents-status
     * Get document submission status for internship
     */
    static getDocumentStatus(req: Request, res: Response): Promise<void>;
    /**
     * GET /admin/internships/bulk/prepare-export
     * Prepare internships for export
     */
    static prepareExport(req: Request, res: Response): Promise<void>;
    /**
     * POST /admin/internships/bulk/send-reminders
     * Send reminders to multiple internships
     */
    static bulkSendReminders(req: Request, res: Response): Promise<void>;
    /**
     * POST /admin/internships/bulk/update-status
     * Update status for multiple internships
     */
    static bulkUpdateStatus(req: Request, res: Response): Promise<void>;
    /**
     * POST /admin/internships/generate-report
     * Generate report for internships
     */
    static generateReport(req: Request, res: Response): Promise<void>;
    /**
     * GET /admin/internships/analytics/capacity-distribution
     * Get company capacity analytics
     */
    static getCapacityAnalytics(req: Request, res: Response): Promise<void>;
    /**
     * GET /admin/internships/analytics/document-submission-rate
     * Get document submission analytics
     */
    static getDocumentSubmissionRate(req: Request, res: Response): Promise<void>;
    /**
     * POST /admin/internships/enhanced/capacity/validate
     * Validate company capacity
     */
    static validateCapacity(req: Request, res: Response): Promise<void>;
    /**
     * GET /admin/internships/enhanced/analytics/deadline-tracking
     * Get deadline tracking analytics
     */
    static getDeadlineTracking(req: Request, res: Response): Promise<void>;
    /**
     * GET /admin/internships/enhanced/documents/completion-rate
     * Get document completion rate
     */
    static getDocumentCompletionRate(req: Request, res: Response): Promise<void>;
}
export default InternshipsEnhancedController;
//# sourceMappingURL=internshipsEnhancedController.d.ts.map