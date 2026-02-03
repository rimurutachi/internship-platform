export interface ReportFilters {
    internship_id?: string;
    student_id?: string;
    status?: 'pending_approval' | 'approved' | 'rejected';
    week_number?: number;
}
/**
 * Get all student reports for a supervisor
 * Returns reports from all internships supervised by this supervisor
 */
export declare function getStudentReports(supervisorId: string, filters?: ReportFilters): Promise<{
    success: boolean;
    data: any[];
    error?: undefined;
} | {
    success: boolean;
    error: any;
    data?: undefined;
}>;
/**
 * Get pending reports count for a supervisor
 */
export declare function getPendingReportsCount(supervisorId: string): Promise<{
    success: boolean;
    data: {
        count: number;
    };
    error?: undefined;
} | {
    success: boolean;
    error: any;
    data?: undefined;
}>;
/**
 * Approve a weekly report
 */
export declare function approveWeeklyReport(reportId: string, supervisorId: string, comments?: string): Promise<{
    success: boolean;
    data: any;
    message: string;
    error?: undefined;
} | {
    success: boolean;
    error: any;
    data?: undefined;
    message?: undefined;
}>;
/**
 * Reject a weekly report
 */
export declare function rejectWeeklyReport(reportId: string, supervisorId: string, rejectionReason: string): Promise<{
    success: boolean;
    data: any;
    message: string;
    error?: undefined;
} | {
    success: boolean;
    error: any;
    data?: undefined;
    message?: undefined;
}>;
/**
 * Get report statistics for supervisor
 */
export declare function getReportStatistics(supervisorId: string): Promise<{
    success: boolean;
    data: {
        total: number;
        pending: number;
        approved: number;
        rejected: number;
    };
    error?: undefined;
} | {
    success: boolean;
    error: any;
    data?: undefined;
}>;
/**
 * Get reports summary by student
 */
export declare function getReportsSummaryByStudent(supervisorId: string, internshipId?: string): Promise<{
    success: boolean;
    data: {
        student: {
            id: any;
            first_name: any;
            last_name: any;
            email: any;
        } | null;
        internship_id: any;
        total_reports: number;
        pending: number;
        approved: number;
        rejected: number;
    }[];
    error?: undefined;
} | {
    success: boolean;
    error: any;
    data?: undefined;
}>;
/**
 * Add comment to existing report (without changing status)
 */
export declare function addCommentToReport(reportId: string, supervisorId: string, comment: string): Promise<{
    success: boolean;
    data: any;
    message: string;
    error?: undefined;
} | {
    success: boolean;
    error: any;
    data?: undefined;
    message?: undefined;
}>;
//# sourceMappingURL=supervisorReportsService.d.ts.map