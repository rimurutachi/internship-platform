export interface WeeklyReportData {
    internship_id: string;
    week_number: number;
    accomplishments: string;
    hours_rendered: number;
    challenges?: string;
    learnings?: string;
}
export interface WeeklyReportFilters {
    internship_id?: string;
    student_id?: string;
    status?: 'pending_approval' | 'approved' | 'rejected';
    week_number?: number;
}
/**
 * Create a new weekly accomplishment report
 */
export declare function createWeeklyReport(studentId: string, reportData: WeeklyReportData): Promise<{
    success: boolean;
    data: any;
    error?: undefined;
} | {
    success: boolean;
    error: any;
    data?: undefined;
}>;
/**
 * Get all weekly reports for a student
 */
export declare function getMyWeeklyReports(studentId: string, internshipId?: string): Promise<{
    success: boolean;
    data: any[];
    error?: undefined;
} | {
    success: boolean;
    error: any;
    data?: undefined;
}>;
/**
 * Update a weekly report (only if pending or rejected)
 */
export declare function updateWeeklyReport(reportId: string, studentId: string, updates: Partial<WeeklyReportData>): Promise<{
    success: boolean;
    data: any;
    error?: undefined;
} | {
    success: boolean;
    error: any;
    data?: undefined;
}>;
/**
 * Get weekly reports by internship (for supervisor/advisor view)
 */
export declare function getWeeklyReportsByInternship(internshipId: string, filters?: WeeklyReportFilters): Promise<{
    success: boolean;
    data: any[];
    error?: undefined;
} | {
    success: boolean;
    error: any;
    data?: undefined;
}>;
/**
 * Get single weekly report by ID
 */
export declare function getWeeklyReportById(reportId: string): Promise<{
    success: boolean;
    data: any;
    error?: undefined;
} | {
    success: boolean;
    error: any;
    data?: undefined;
}>;
/**
 * Get next report deadline for a student
 */
export declare function getNextReportDeadline(studentId: string, internshipId: string): Promise<{
    success: boolean;
    data: {
        next_week: number;
        week_start: string;
        week_end: string;
        is_overdue: boolean;
    };
    error?: undefined;
} | {
    success: boolean;
    data: null;
    error?: undefined;
} | {
    success: boolean;
    error: any;
    data?: undefined;
}>;
/**
 * Delete a weekly report (only if pending)
 */
export declare function deleteWeeklyReport(reportId: string, studentId: string): Promise<{
    success: boolean;
    message: string;
    error?: undefined;
} | {
    success: boolean;
    error: any;
    message?: undefined;
}>;
//# sourceMappingURL=weeklyReportsService.d.ts.map