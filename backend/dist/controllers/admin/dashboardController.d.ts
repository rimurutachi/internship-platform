import { Request, Response } from 'express';
export declare class DashboardController {
    /**
     * Get all KPI metrics for dashboard cards
     * GET /admin/dashboard/kpis
     */
    getKPIs(req: Request, res: Response): Promise<void>;
    /**
     * Get user growth by role over months
     * GET /admin/dashboard/usage-engagement?months=6
     */
    getUsageEngagement(req: Request, res: Response): Promise<void>;
    /**
     * Get system performance metrics over hours
     * GET /admin/dashboard/performance-metrics?hours=24
     */
    getPerformanceMetrics(req: Request, res: Response): Promise<void>;
    /**
     * Get feature usage analytics
     * GET /admin/dashboard/feature-usage
     */
    getFeatureUsage(req: Request, res: Response): Promise<void>;
    /**
     * Get complete dashboard overview (all data in one call)
     * GET /admin/dashboard/overview
     */
    getDashboardOverview(req: Request, res: Response): Promise<void>;
    /**
     * Helper method to fetch KPIs data (used by getDashboardOverview)
     */
    private fetchKPIsData;
}
declare const _default: DashboardController;
export default _default;
//# sourceMappingURL=dashboardController.d.ts.map