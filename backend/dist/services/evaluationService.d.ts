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
    /**
     * Analyze draft evaluation text (lightweight, real-time feedback)
     *
     * @param text - Evaluation feedback text
     * @returns Draft analysis with features and sentiment
     */
    analyzeDraft(text: string): Promise<import("./aiService").DraftAnalysisResult>;
    getById(id: string): Promise<Evaluation | null>;
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
        limit?: number;
        offset?: number;
    }): Promise<any[]>;
}
//# sourceMappingURL=evaluationService.d.ts.map