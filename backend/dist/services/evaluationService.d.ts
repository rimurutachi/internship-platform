/**
 * Evaluation Service - Core CRUD & AI Processing
 *
 * Handles evaluation creation, AI analysis, submission, and approval workflow.
 * Use EvaluationServiceFacade (evaluation.service.ts) for a unified API that includes analytics.
 *
 * @deprecated Consider using EvaluationServiceFacade for new code
 */
import { Evaluation, CreateEvaluationDTO, ProcessEvaluationResult } from "../models/evaluation";
export declare class EvaluationService {
    create(data: CreateEvaluationDTO): Promise<Evaluation>;
    getById(id: string): Promise<Evaluation | null>;
    update(id: string, data: any): Promise<Evaluation>;
    processWithAI(evaluationId: string): Promise<ProcessEvaluationResult>;
    submit(evaluationId: string): Promise<any>;
    approve(evaluationId: string, finalGrade: number): Promise<Evaluation>;
    getByInternship(internshipId: string): Promise<Evaluation[]>;
    /**
     * Get evaluations by supervisor with optional filters
     */
    getBySupervisor(supervisorId?: string, status?: string): Promise<any[]>;
    /**
     * Get all evaluations with filters (admin/general query)
     */
    getAll(filters?: {
        supervisor_id?: string;
        status?: string;
        evaluation_type?: 'weekly' | 'midterm' | 'final';
        limit?: number;
        offset?: number;
    }): Promise<any[]>;
    /**
     * Get evaluation timeline for an internship
     * Shows all evaluations (weekly, midterm, final) in chronological order
     */
    getTimelineByInternship(internshipId: string): Promise<any[]>;
    /**
     * Get evaluations by type for an internship
     */
    getByType(internshipId: string, evaluationType: 'weekly' | 'midterm' | 'final'): Promise<any[]>;
    /**
     * Get weekly evaluations for an internship
     */
    getWeeklyEvaluations(internshipId: string): Promise<any[]>;
    /**
     * Get overdue evaluations (draft evaluations past due date)
     */
    getOverdueEvaluations(supervisorId?: string): Promise<any[]>;
    /**
     * Get evaluation progress summary for an internship
     * Returns count of completed evaluations by type
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
}
//# sourceMappingURL=evaluationService.d.ts.map