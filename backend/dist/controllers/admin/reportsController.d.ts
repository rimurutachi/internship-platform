import { Request, Response } from 'express';
declare class ReportsController {
    static getOverview(req: Request, res: Response): Promise<void>;
    static getMonthlyStats(req: Request, res: Response): Promise<void>;
    static getUserGrowth(req: Request, res: Response): Promise<void>;
    static getInternshipStatus(req: Request, res: Response): Promise<void>;
    static getEvaluationMetrics(req: Request, res: Response): Promise<void>;
    static getPerformance(req: Request, res: Response): Promise<void>;
    static getActivityTimeline(req: Request, res: Response): Promise<void>;
    static getMetricTrend(req: Request, res: Response): Promise<void>;
    static exportReport(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
}
export default ReportsController;
//# sourceMappingURL=reportsController.d.ts.map