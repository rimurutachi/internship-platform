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