export interface OJTDashboardMetrics {
    students_enrolled: number;
    students_pending_deployment: number;
    active_internships: number;
    completed_internships: number;
    total_companies: number;
    companies_with_capacity: number;
    pending_weekly_reports: number;
    pending_supervisor_evaluations: number;
    pending_advisor_evaluations: number;
    completed_evaluations_this_month: number;
    timestamp: string;
}
/**
 * Calculate real-time OJT-centric dashboard metrics
 * NO SYSTEM METRICS - Only OJT/Internship data
 */
export declare function calculateDashboardMetrics(universityId: string): Promise<OJTDashboardMetrics>;
/**
 * Store metrics snapshot for historical tracking
 * Run this periodically (daily) via cron job
 */
export declare function storeMetricsSnapshot(universityId: string): Promise<{
    success: boolean;
    message: string;
    error?: undefined;
} | {
    success: boolean;
    error: any;
    message?: undefined;
}>;
/**
 * Get historical metrics for trend analysis
 */
export declare function getHistoricalMetrics(universityId: string, days?: number): Promise<{
    success: boolean;
    data: any[];
    error?: undefined;
} | {
    success: boolean;
    error: any;
    data?: undefined;
}>;
/**
 * Get AI insights for admin dashboard (v2.0.0)
 * Now uses analyticsService for on-demand trend analysis
 */
export declare function getAIInsights(universityId: string): Promise<{
    success: boolean;
    data: {
        type: "sentiment_trend" | "skill_analysis" | "performance" | "comparison";
        message: string;
        title: string;
        category: string;
    }[] | {
        type: string;
        message: string;
    }[];
}>;
/**
 * Get dashboard overview for admin
 * Combines metrics and insights
 */
export declare function getAdminDashboardOverview(universityId: string): Promise<{
    success: boolean;
    data: {
        metrics: OJTDashboardMetrics;
        insights: {
            type: "sentiment_trend" | "skill_analysis" | "performance" | "comparison";
            message: string;
            title: string;
            category: string;
        }[] | {
            type: string;
            message: string;
        }[];
        recent_activity: {
            weekly_reports_this_week: number;
            evaluations_this_week: number;
        };
    };
    error?: undefined;
} | {
    success: boolean;
    error: any;
    data?: undefined;
}>;
/**
 * Get quick action items for admin
 * Items that need immediate attention
 */
export declare function getQuickActionItems(universityId: string): Promise<{
    success: boolean;
    data: {
        type: string;
        priority: string;
        count: number;
        message: string;
        link: string;
    }[];
    error?: undefined;
} | {
    success: boolean;
    error: any;
    data?: undefined;
}>;
//# sourceMappingURL=adminDashboardService.d.ts.map