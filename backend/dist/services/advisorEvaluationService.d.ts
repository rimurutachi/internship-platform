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
 * AI analytics will be triggered AFTER approval
 */
export declare function approveEvaluation(evaluationId: string, advisorId: string, approvalData: {
    final_grade_override?: number;
    grade_override_reason?: string;
    approval_comments: string;
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
 * Get weekly reports for context
 * Advisor can view alongside evaluation
 */
export declare function getWeeklyReportsForContext(internshipId: string): Promise<{
    success: boolean;
    data: any[];
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
        weekly_reports: any[];
    };
    error?: undefined;
} | {
    success: boolean;
    error: any;
    data?: undefined;
}>;
//# sourceMappingURL=advisorEvaluationService.d.ts.map