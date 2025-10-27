import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
export declare function createInternship(req: Request, res: Response): Promise<void>;
export declare function getInternship(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function getAllInternships(req: Request, res: Response): Promise<void>;
export declare function updateInternship(req: Request, res: Response): Promise<void>;
export declare function deleteInternship(req: Request, res: Response): Promise<void>;
export declare function getMyInternships(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
//# sourceMappingURL=internshipController.d.ts.map