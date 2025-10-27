import { Request, Response } from "express";
export declare function createEvaluation(req: Request, res: Response): Promise<void>;
export declare function getEvaluation(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function submitEvaluation(req: Request, res: Response): Promise<void>;
export declare function approveEvaluation(req: Request, res: Response): Promise<void>;
export declare function getInternshipEvaluations(req: Request, res: Response): Promise<void>;
//# sourceMappingURL=evaluationController.d.ts.map