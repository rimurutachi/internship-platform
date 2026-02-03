export declare class DashboardService {
    /**
     * Calculate system uptime based on API request logs
     */
    calculateUptime(hoursBack?: number): Promise<number>;
    /**
     * Calculate average response time from API logs
     */
    calculateAverageResponseTime(hoursBack?: number): Promise<number>;
    /**
     * Get latest CPU usage from system metrics
     */
    getLatestCPUUsage(): Promise<number>;
    /**
     * Calculate feature usage analytics
     */
    calculateFeatureUsage(): Promise<Array<{
        feature: string;
        usage_percent: number;
    }>>;
    /**
     * Get user growth by role over months
     */
    getUserGrowthByRole(monthsBack?: number): Promise<Array<{
        month: string;
        students: number;
        advisors: number;
        supervisors: number;
        admins: number;
    }>>;
    /**
     * Get system performance metrics over hours
     */
    getPerformanceMetrics(hoursBack?: number): Promise<Array<{
        time: string;
        response_time: number;
        cpu_usage: number;
        ai_processing: number;
    }>>;
}
declare const _default: DashboardService;
export default _default;
//# sourceMappingURL=dashboardService.d.ts.map