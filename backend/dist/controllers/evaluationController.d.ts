import { Request, Response } from "express";
/**
 * Analyze draft evaluation text (real-time feedback)
 * POST /api/evaluations/analyze-draft
 */
export declare function analyzeDraftEvaluation(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function createEvaluation(req: Request, res: Response): Promise<void>;
export declare function getEvaluation(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function submitEvaluation(req: Request, res: Response): Promise<void>;
export declare function approveEvaluation(req: Request, res: Response): Promise<void>;
export declare function getInternshipEvaluations(req: Request, res: Response): Promise<void>;
/**
 * Get evaluations with optional filters
 * GET /api/evaluations?supervisor_id=xxx&status=draft
 */
export declare function getEvaluations(req: Request, res: Response): Promise<void>;
//# sourceMappingURL=evaluationController.d.ts.map