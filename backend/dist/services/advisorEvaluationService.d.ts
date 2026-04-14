/**
 * Get pending evaluations for an advisor
 */
export declare function getPendingEvaluations(advisorId: string): Promise<{
    success: boolean;
    data: any[];
    error?: undefined;
} | {
    success: boolean;
    error: any;
    data?: undefined;
}>;
/**
 * Get evaluations by status for advisor
 */
export declare function getEvaluationsByStatus(advisorId: string, status: 'submitted' | 'revision_requested' | 'approved'): Promise<{
    success: boolean;
    data: any[];
    error?: undefined;
} | {
    success: boolean;
    error: any;
    data?: undefined;
}>;
/**
 * Approve evaluation
 * Optionally override final grade with justification
 * Optionally set grade reveal date for scheduled visibility
 * AI analytics will be triggered AFTER approval
 */
export declare function approveEvaluation(evaluationId: string, advisorId: string, approvalData: {
    approval_comments?: string;
    grade_override?: number;
    grade_override_reason?: string;
    grade_reveal_date?: string;
}): Promise<{
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
 * Request revision on evaluation
 * Sends evaluation back to supervisor for changes
 */
export declare function requestRevision(evaluationId: string, advisorId: string, revisionReason: string): Promise<{
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
 * Get daily reports progress summary for context
 * Advisor can see overall progress (total hours, days reported) but NOT report content
 */
export declare function getDailyReportsProgressForContext(internshipId: string): Promise<{
    success: boolean;
    data: {
        total_hours: number;
        total_days_reported: number;
        first_report_date: any;
        last_report_date: any;
    };
    error?: undefined;
} | {
    success: boolean;
    error: any;
    data?: undefined;
}>;
/**
 * Get evaluation statistics for advisor dashboard
 */
export declare function getEvaluationStatistics(advisorId: string): Promise<{
    success: boolean;
    data: {
        total: number;
        pending: number;
        revision_requested: number;
        approved: number;
    };
    error?: undefined;
} | {
    success: boolean;
    error: any;
    data?: undefined;
}>;
/**
 * Get evaluation with full context (for advisor review)
 */
export declare function getEvaluationWithContext(evaluationId: string, advisorId: string): Promise<{
    success: boolean;
    data: {
        evaluation: any;
        daily_reports_progress: {
            total_hours: number;
            total_days_reported: number;
        };
    };
    error?: undefined;
} | {
    success: boolean;
    error: any;
    data?: undefined;
}>;
//# sourceMappingURL=advisorEvaluationService.d.ts.map