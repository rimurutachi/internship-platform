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
    processWithAI(evaluationId: string): Promise<ProcessEvaluationResult>;
    submit(evaluationId: string): Promise<Evaluation>;
    approve(evaluationId: string, finalGrade: number): Promise<Evaluation>;
    getByInternship(internshipId: string): Promise<Evaluation[]>;
}
//# sourceMappingURL=evaluationService.d.ts.map