import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth';
/**
 * Create final evaluation (draft)
 * NO AI INVOLVEMENT - supervisor creates evaluation manually
 */
export declare function createFinalEvaluation(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>>>;
/**
 * Save final evaluation draft
 * Allows multiple saves while supervisor completes the form
 */
export declare function saveFinalEvaluationDraft(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>>>;
/**
 * Submit final evaluation to advisor for review
 * Changes status from draft to submitted
 */
export declare function submitFinalEvaluation(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>>>;
/**
 * Get evaluation by ID
 */
export declare function getEvaluationById(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>>>;
/**
 * Get evaluations by internship
 */
export declare function getEvaluationsByInternship(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>>>;
/**
 * Delete evaluation draft
 */
export declare function deleteEvaluationDraft(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>>>;
//# sourceMappingURL=evaluationController.d.ts.map