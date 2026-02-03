declare class ReportsService {
    static getOverview(): Promise<{
        total_users: number;
        active_internships: number;
        total_evaluations: number;
        completion_rate: number;
    }>;
    static generateMonthlyStats(months?: number, year?: number): Promise<any[]>;
    static generateUserGrowth(groupBy?: string, periods?: number): Promise<any[]>;
    static generateInternshipStatus(groupBy?: string): Promise<{
        statuses: {
            status: string;
            count: number;
            percentage: number;
        }[];
        avg_completion_rate: number;
    }>;
    static generateEvaluationMetrics(dateRange?: {
        start?: string;
        end?: string;
    }): Promise<{
        avg_ratings: {
            overall: number;
            technical: number;
            communication: number;
            work_ethic: number;
        };
        submission_stats: {
            on_time: number;
            late: number;
            pending: number;
        };
        sentiment: {
            positive: number;
            neutral: number;
            negative: number;
        };
        quality_score: number;
    }>;
    static generatePerformanceMetrics(): Promise<{
        api_response_time: {
            avg: number;
            p95: number;
            p99: number;
        };
        error_rate: number;
        active_sessions: number;
        slow_queries: never[];
    }>;
    static generateActivityTimeline(timeframe?: string, page?: number, limit?: number): Promise<{
        activities: {
            id: any;
            user_id: any;
            user_name: any;
            action: any;
            resource: any;
            description: any;
            timestamp: any;
            entity_type: any;
        }[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
    static generateMetricTrend(metric: string, days?: number): Promise<any[]>;
    static exportReport(format: string, metrics: string[], dateRange: any, groupBy?: string): Promise<string | Buffer<ArrayBufferLike>>;
    private static convertToCSV;
    private static convertToPDF;
}
export default ReportsService;
//# sourceMappingURL=reportsService.d.ts.map