"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DashboardController = void 0;
const supabase_js_1 = require("@supabase/supabase-js");
const dashboardService_1 = __importDefault(require("../../services/dashboardService"));
const supabase = (0, supabase_js_1.createClient)(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
class DashboardController {
    /**
     * Get all KPI metrics for dashboard cards
     * GET /admin/dashboard/kpis
     */
    async getKPIs(req, res) {
        try {
            // Total Active Users
            const { count: totalUsers, error: usersError } = await supabase
                .from('users')
                .select('id', { count: 'exact', head: true })
                .eq('status', 'active');
            if (usersError)
                throw usersError;
            // System Uptime (last 24h)
            const systemUptime = await dashboardService_1.default.calculateUptime(24);
            // Average Response Time (last 24h)
            const responseTime = await dashboardService_1.default.calculateAverageResponseTime(24);
            // CPU Usage (latest)
            const cpuUsage = await dashboardService_1.default.getLatestCPUUsage();
            // Active Internships
            const { count: activeInternships, error: internshipsError } = await supabase
                .from('internships')
                .select('id', { count: 'exact', head: true })
                .eq('status', 'active');
            if (internshipsError)
                throw internshipsError;
            // Security Alerts (last 24h)
            const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
            const { count: securityAlerts, error: alertsError } = await supabase
                .from('security_alerts')
                .select('id', { count: 'exact', head: true })
                .gte('created_at', twentyFourHoursAgo);
            // Use default value if table doesn't exist
            const alertsCount = alertsError ? 0 : (securityAlerts || 0);
            res.json({
                success: true,
                data: {
                    total_users: totalUsers || 0,
                    system_uptime: systemUptime,
                    response_time: responseTime,
                    cpu_usage: cpuUsage,
                    active_internships: activeInternships || 0,
                    security_alerts_24h: alertsCount
                }
            });
        }
        catch (error) {
            console.error('Error getting KPIs:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch KPI metrics'
            });
        }
    }
    /**
     * Get user growth by role over months
     * GET /admin/dashboard/usage-engagement?months=6
     */
    async getUsageEngagement(req, res) {
        try {
            const months = parseInt(req.query.months) || 6;
            const data = await dashboardService_1.default.getUserGrowthByRole(months);
            res.json({
                success: true,
                data
            });
        }
        catch (error) {
            console.error('Error getting usage engagement:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch usage engagement data'
            });
        }
    }
    /**
     * Get system performance metrics over hours
     * GET /admin/dashboard/performance-metrics?hours=24
     */
    async getPerformanceMetrics(req, res) {
        try {
            const hours = parseInt(req.query.hours) || 24;
            const data = await dashboardService_1.default.getPerformanceMetrics(hours);
            res.json({
                success: true,
                data
            });
        }
        catch (error) {
            console.error('Error getting performance metrics:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch performance metrics'
            });
        }
    }
    /**
     * Get feature usage analytics
     * GET /admin/dashboard/feature-usage
     */
    async getFeatureUsage(req, res) {
        try {
            const data = await dashboardService_1.default.calculateFeatureUsage();
            res.json({
                success: true,
                data
            });
        }
        catch (error) {
            console.error('Error getting feature usage:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch feature usage analytics'
            });
        }
    }
    /**
     * Get complete dashboard overview (all data in one call)
     * GET /admin/dashboard/overview
     */
    async getDashboardOverview(req, res) {
        try {
            // Fetch all data in parallel for better performance
            const [kpisResult, usageEngagement, performanceMetrics, featureUsage] = await Promise.all([
                this.fetchKPIsData(),
                dashboardService_1.default.getUserGrowthByRole(6),
                dashboardService_1.default.getPerformanceMetrics(24),
                dashboardService_1.default.calculateFeatureUsage()
            ]);
            res.json({
                success: true,
                data: {
                    kpis: kpisResult,
                    usage_engagement: usageEngagement,
                    performance_metrics: performanceMetrics,
                    feature_usage: featureUsage
                }
            });
        }
        catch (error) {
            console.error('Error getting dashboard overview:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch dashboard overview'
            });
        }
    }
    /**
     * Helper method to fetch KPIs data (used by getDashboardOverview)
     */
    async fetchKPIsData() {
        const { count: totalUsers } = await supabase
            .from('users')
            .select('id', { count: 'exact', head: true })
            .eq('status', 'active');
        const systemUptime = await dashboardService_1.default.calculateUptime(24);
        const responseTime = await dashboardService_1.default.calculateAverageResponseTime(24);
        const cpuUsage = await dashboardService_1.default.getLatestCPUUsage();
        const { count: activeInternships } = await supabase
            .from('internships')
            .select('id', { count: 'exact', head: true })
            .eq('status', 'active');
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
        const { count: securityAlerts, error: alertsError } = await supabase
            .from('security_alerts')
            .select('id', { count: 'exact', head: true })
            .gte('created_at', twentyFourHoursAgo);
        // Use default value if table doesn't exist
        const alertsCount = alertsError ? 0 : (securityAlerts || 0);
        return {
            total_users: totalUsers || 0,
            system_uptime: systemUptime,
            response_time: responseTime,
            cpu_usage: cpuUsage,
            active_internships: activeInternships || 0,
            security_alerts_24h: alertsCount
        };
    }
}
exports.DashboardController = DashboardController;
exports.default = new DashboardController();
//# sourceMappingURL=dashboardController.js.map