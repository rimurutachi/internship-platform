import { Request, Response } from "express";
export declare function createEvaluation(req: Request, res: Response): Promise<void>;
export declare function getEvaluation(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function updateEvaluation(req: Request, res: Response): Promise<void>;
export declare function submitEvaluation(req: Request, res: Response): Promise<void>;
export declare function approveEvaluation(req: Request, res: Response): Promise<void>;
export declare function getInternshipEvaluations(req: Request, res: Response): Promise<void>;
/**
 * Get evaluations with optional filters
 * GET /api/evaluations?supervisor_id=xxx&status=draft&evaluation_type=weekly
 */
export declare function getEvaluations(req: Request, res: Response): Promise<void>;
/**
 * Get evaluation timeline for an internship
 * GET /api/evaluations/timeline/:internshipId
 */
export declare function getEvaluationTimeline(req: Request, res: Response): Promise<void>;
/**
 * Get evaluations by type for an internship
 * GET /api/evaluations/internship/:internshipId/type/:evaluationType
 */
export declare function getEvaluationsByType(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
/**
 * Get overdue evaluations
 * GET /api/evaluations/overdue?supervisor_id=xxx
 */
export declare function getOverdueEvaluations(req: Request, res: Response): Promise<void>;
/**
 * Get evaluation progress summary for an internship
 * GET /api/evaluations/progress/:internshipId
 */
export declare function getEvaluationProgress(req: Request, res: Response): Promise<void>;
//# sourceMappingURL=evaluationController.d.ts.map