import { Response } from "express";
export declare const sendSuccessResponse: (res: Response, message: string, data?: any, statusCode?: number) => Response<any, Record<string, any>>;
export declare const sendErrorResponse: (res: Response, error: string, message: string, statusCode?: number) => Response<any, Record<string, any>>;
export declare const sendValidationError: (res: Response, message: string, statusCode?: number) => Response<any, Record<string, any>>;
export declare const sendAuthError: (res: Response, message?: string, statusCode?: number) => Response<any, Record<string, any>>;
export declare const sendAuthorizationError: (res: Response, message?: string, statusCode?: number) => Response<any, Record<string, any>>;
export declare const sendNotFoundError: (res: Response, message?: string, statusCode?: number) => Response<any, Record<string, any>>;
export declare const sendInternalError: (res: Response, message?: string, statusCode?: number) => Response<any, Record<string, any>>;
export declare const asyncHandler: (fn: Function) => (req: any, res: Response, next: any) => void;
export declare const globalErrorHandler: (error: any, req: any, res: Response, next: any) => void;
//# sourceMappingURL=responseUtils.d.ts.map