import { Request, Response, NextFunction } from "express";
import { AuthRequest } from "./auth";
export declare const handleValidationErrors: (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
export declare const validateGetNotifications: (((req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined) | import("express-validator").ValidationChain)[];
export declare const validateMarkNotificationAsRead: (((req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined) | import("express-validator").ValidationChain)[];
export declare const validateCreateNotification: (((req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined) | import("express-validator").ValidationChain | ((req: Request, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>))[];
export declare const validateNotificationOwnership: (req: AuthRequest, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
//# sourceMappingURL=communciationValidators.d.ts.map