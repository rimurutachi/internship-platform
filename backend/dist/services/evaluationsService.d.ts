/**
 * Evaluations Service - Analytics & Metrics
 *
 * Handles evaluation analytics, quality metrics, reporting, and data export.
 * Use EvaluationServiceFacade (evaluation.service.ts) for a unified API.
 *
 * @deprecated Consider using EvaluationServiceFacade for new code
 */
interface Evaluation {
    id: string;
    rating_overall: number | null;
    rating_technical: number | null;
    rating_communication: number | null;
    rating_work_ethic: number | null;
    sentiment_scores: Record<string, number> | null;
    lit_features: string[] | null;
    recommended_grade: number | null;
    confidence_score: number | null;
    bias_check_passed: boolean | null;
    status: string;
    [key: string]: any;
}
interface QualityMetrics {
    total: number;
    on_draft: number;
    submitted: number;
    approved: number;
}
export declare class EvaluationsService {
    /**
     * Calculate average rating from all rating fields
     */
    calculateAverageRating(evaluation: Evaluation): number;
    /**
     * Format AI results for display
     */
    formatAIResults(evaluation: Evaluation): {
        sentiment_analysis: Record<string, number>;
        features: string[];
        recommended_grade: number | null;
        confidence_score: number;
        bias_check_passed: boolean;
    };
    /**
     * Check if evaluation is ready for approval
     */
    isReadyForApproval(evaluation: Evaluation): boolean;
    /**
     * Get evaluation count metrics (total and by status)
     * Note: This replaces old AI quality metrics (confidence/bias/sentiment)
     */
    getQualityMetrics(): Promise<QualityMetrics>;
    /**
     * Get metrics grouped by supervisor
     */
    getMetricsBySupervisor(): Promise<{
        id: any;
        name: any;
        email: any;
        eval_count: any;
        avg_ratings: number;
        avg_confidence: number;
    }[]>;
    /**
     * Get metrics grouped by company
     */
    getMetricsByCompany(): Promise<{
        id: any;
        name: any;
        eval_count: any;
        avg_ratings: number;
        avg_confidence: number;
    }[]>;
    /**
     * Export evaluations in specified format
     */
    exportEvaluations(filters: any, format: 'json' | 'csv', includeAIResults: boolean): Promise<string>;
    /**
     * Generate quality report for date range
     */
    generateQualityReport(startDate: Date, endDate: Date): Promise<{
        total: number;
        processed: number;
        approved: number;
        rejected: number;
        avg_confidence: number;
        bias_pass_rate: number;
    }>;
}
export {};
//# sourceMappingURL=evaluationsService.d.ts.map