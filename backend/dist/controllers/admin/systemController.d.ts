import { Request, Response } from 'express';
declare class SystemController {
    /**
     * Get overall system metrics
     */
    getMetrics(req: Request, res: Response): Promise<void>;
    /**
     * Get health status
     */
    getHealth(req: Request, res: Response): Promise<void>;
    /**
     * Get services status
     */
    getServices(req: Request, res: Response): Promise<void>;
    /**
     * Get application metrics
     */
    getApplicationMetrics(req: Request, res: Response): Promise<void>;
    /**
     * Get database metrics
     */
    getDatabaseMetrics(req: Request, res: Response): Promise<void>;
    /**
     * Get recent events
     */
    getRecentEvents(req: Request, res: Response): Promise<void>;
    /**
     * Get metrics trend
     */
    getMetricsTrend(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * Acknowledge/resolve an event
     */
    acknowledgeEvent(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * Clear old events
     */
    clearOldEvents(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * Get performance stats (slow queries, bottlenecks)
     */
    getPerformance(req: Request, res: Response): Promise<void>;
    /**
     * System maintenance endpoint
     */
    performMaintenance(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * Get error breakdown by type
     */
    getErrorBreakdown(req: Request, res: Response): Promise<void>;
    /**
     * Get service logs
     */
    getServiceLogs(req: Request, res: Response): Promise<void>;
    /**
     * Restart service (simulated)
     */
    restartService(req: Request, res: Response): Promise<void>;
}
declare const _default: SystemController;
export default _default;
//# sourceMappingURL=systemController.d.ts.map