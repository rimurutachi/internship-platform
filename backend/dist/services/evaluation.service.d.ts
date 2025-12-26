/**
 * Evaluation Service Facade
 *
 * Unified interface combining:
 * - EvaluationService: Core CRUD + AI processing
 * - EvaluationsService: Analytics, metrics, and export
 *
 * This facade provides a clean, single entry point for all evaluation-related operations
 * while maintaining backward compatibility with existing services.
 */
import { EvaluationService } from './evaluationService';
import { EvaluationsService } from './evaluationsService';
import { Evaluation, CreateEvaluationDTO } from '../models/evaluation';
export declare class EvaluationServiceFacade {
    private crudService;
    private analyticsService;
    constructor();
    /**
     * Create a new evaluation (status: draft)
     */
    create(data: CreateEvaluationDTO): Promise<Evaluation>;
    /**
     * Get evaluation by ID with full relations
     */
    getById(id: string): Promise<Evaluation | null>;
    /**
     * Process evaluation with AI analysis
     */
    processWithAI(evaluationId: string): Promise<any>;
    /**
     * Analyze draft text for quick feedback (no persistence)
     */
    analyzeDraft(text: string): Promise<any>;
    /**
     * Update draft evaluation (only allowed while status is draft)
     */
    update(id: string, data: any): Promise<Evaluation>;
    /**
     * Submit evaluation for review (triggers AI processing)
     */
    submit(evaluationId: string): Promise<Evaluation>;
    /**
     * Approve evaluation and set final grade
     */
    approve(evaluationId: string, finalGrade: number): Promise<Evaluation>;
    /**
     * Get all evaluations for an internship
     */
    getByInternship(internshipId: string): Promise<Evaluation[]>;
    /**
     * Get evaluations with filters (supervisor/status/type)
     */
    getAll(filters?: {
        supervisor_id?: string;
        status?: string;
        evaluation_type?: 'weekly' | 'midterm' | 'final';
        limit?: number;
        offset?: number;
    }): Promise<any[]>;
    /**
     * Timeline of evaluations for an internship
     */
    getTimelineByInternship(internshipId: string): Promise<any[]>;
    /**
     * Get evaluations by type for an internship
     */
    getByType(internshipId: string, evaluationType: 'weekly' | 'midterm' | 'final'): Promise<any[]>;
    /**
     * Get overdue evaluations (draft past due)
     */
    getOverdueEvaluations(supervisorId?: string): Promise<any[]>;
    /**
     * Progress summary for an internship
     */
    getProgressSummary(internshipId: string): Promise<{
        weekly: {
            total: number;
            completed: number;
            pending: number;
        };
        midterm: {
            completed: boolean;
            status?: string;
        };
        final: {
            completed: boolean;
            status?: string;
        };
    }>;
    /**
     * Calculate average rating from all rating fields
     */
    calculateAverageRating(evaluation: any): number;
    /**
     * Format AI analysis results for display
     */
    formatAIResults(evaluation: any): any;
    /**
     * Check if evaluation is ready for approval
     */
    isReadyForApproval(evaluation: any): boolean;
    /**
     * Get quality metrics for current month
     */
    getQualityMetrics(): Promise<any>;
    /**
     * Get evaluation metrics grouped by supervisor
     */
    getMetricsBySupervisor(): Promise<any>;
    /**
     * Get evaluation metrics grouped by company
     */
    getMetricsByCompany(): Promise<any>;
    /**
     * Export evaluations to CSV or JSON
     */
    exportEvaluations(filters: any, format: 'csv' | 'json', includeAIResults?: boolean): Promise<string>;
    /**
     * Generate quality report for date range
     */
    generateQualityReport(startDate: Date, endDate: Date): Promise<any>;
}
export declare const evaluationService: EvaluationServiceFacade;
export { EvaluationService, EvaluationsService };
//# sourceMappingURL=evaluation.service.d.ts.map