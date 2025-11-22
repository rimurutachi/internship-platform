import { Request, Response, NextFunction } from 'express';
/**
 * Validate grant access request
 */
export declare const validateGrantAccess: (import("express-validator").ValidationChain | ((req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined))[];
/**
 * Validate update access level request
 */
export declare const validateUpdateAccessLevel: (import("express-validator").ValidationChain | ((req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined))[];
/**
 * Validate upload version request
 */
export declare const validateUploadVersion: (import("express-validator").ValidationChain | ((req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined))[];
/**
 * Validate pagination parameters
 */
export declare const validatePagination: (import("express-validator").ValidationChain | ((req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined))[];
/**
 * Validate create document request
 */
export declare const validateCreateDocument: (import("express-validator").ValidationChain | ((req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined))[];
/**
 * Validate batch access update request
 */
export declare const validateBatchAccess: (import("express-validator").ValidationChain | ((req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined))[];
/**
 * Validate archive document request
 */
export declare const validateArchive: (import("express-validator").ValidationChain | ((req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined))[];
//# sourceMappingURL=documentValidators.d.ts.map