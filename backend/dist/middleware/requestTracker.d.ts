import { Request, Response, NextFunction } from 'express';
/**
 * Middleware to track all API requests for system metrics
 * Logs request details to api_request_logs table
 */
export declare const requestTracker: (req: Request, res: Response, next: NextFunction) => Promise<void>;
declare global {
    var systemMetrics: {
        trackRequest: (responseTime: number, isError: boolean) => void;
        trackSession: (userId: string) => void;
        removeSession: (userId: string) => void;
        getActiveSessionsCount: () => number;
    } | undefined;
}
//# sourceMappingURL=requestTracker.d.ts.map