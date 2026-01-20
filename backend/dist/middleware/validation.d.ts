import { Request, Response, NextFunction } from "express";
export declare const validateLoginRequest: (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
export declare const validateRegisterRequest: (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
export declare const validateProfileUpdateRequest: (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
export declare const validateRoleChangeRequest: (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
export declare const sanitizeInput: (req: Request, res: Response, next: NextFunction) => void;
/**
 * SECURITY: Strict input validation middleware
 * Rejects requests with unexpected fields (OWASP: Fail safely)
 */
export declare const validateExpectedFields: (allowedFields: string[]) => (req: Request, res: Response, next: NextFunction) => void | Response<any, Record<string, any>>;
/**
 * SECURITY: Input length validation middleware
 * Prevents oversized inputs that could cause DoS
 */
export declare const validateInputLength: (maxLengths: Record<string, number>) => (req: Request, res: Response, next: NextFunction) => void | Response<any, Record<string, any>>;
//# sourceMappingURL=validation.d.ts.map