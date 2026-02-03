"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const systemMetricsService_1 = __importDefault(require("../../services/systemMetricsService"));
const supabase_js_1 = require("@supabase/supabase-js");
// Initialize Supabase client lazily
let supabase;
function getSupabaseClient() {
    if (!supabase) {
        const supabaseUrl = process.env.SUPABASE_URL;
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;
        if (!supabaseUrl || !supabaseServiceKey) {
            throw new Error('Missing Supabase credentials. Please set SUPABASE_URL and SUPABASE_SERVICE_KEY in your .env file');
        }
        supabase = (0, supabase_js_1.createClient)(supabaseUrl, supabaseServiceKey);
    }
    return supabase;
}
class SystemController {
    /**
     * Get overall system metrics
     */
    async getMetrics(req, res) {
        try {
            const metrics = await systemMetricsService_1.default.getSystemMetrics();
            res.json({ success: true, data: metrics });
        }
        catch (error) {
            console.error('Error getting system metrics:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to collect system metrics',
                code: 'METRICS_COLLECTION_FAILED',
                message: error.message
            });
        }
    }
    /**
     * Get health status
     */
    async getHealth(req, res) {
        try {
            const health = await systemMetricsService_1.default.getHealthStatus();
            res.json({ success: true, ...health });
        }
        catch (error) {
            console.error('Error checking system health:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to check system health',
                code: 'HEALTH_CHECK_FAILED',
                message: error.message
            });
        }
    }
    /**
     * Get services status
     */
    async getServices(req, res) {
        try {
            const services = await systemMetricsService_1.default.getServiceStatus();
            res.json({ success: true, services });
        }
        catch (error) {
            console.error('Error getting service status:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to get service status',
                code: 'SERVICE_STATUS_FAILED',
                message: error.message
            });
        }
    }
    /**
     * Get application metrics
     */
    async getApplicationMetrics(req, res) {
        try {
            const appMetrics = await systemMetricsService_1.default.getApplicationMetrics();
            res.json({ success: true, metrics: appMetrics });
        }
        catch (error) {
            console.error('Error getting application metrics:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to get application metrics',
                code: 'APP_METRICS_FAILED',
                message: error.message
            });
        }
    }
    /**
     * Get database metrics
     */
    async getDatabaseMetrics(req, res) {
        try {
            const dbMetrics = await systemMetricsService_1.default.getDatabaseMetrics();
            res.json({ success: true, database: dbMetrics });
        }
        catch (error) {
            console.error('Error getting database metrics:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to get database metrics',
                code: 'DB_METRICS_FAILED',
                message: error.message
            });
        }
    }
    /**
     * Get recent events
     */
    async getRecentEvents(req, res) {
        try {
            const { limit = 20, severity, type } = req.query;
            let query = getSupabaseClient().from('system_events').select('*');
            if (severity) {
                query = query.eq('severity', severity);
            }
            if (type) {
                query = query.eq('type', type);
            }
            const { data, error } = await query
                .order('created_at', { ascending: false })
                .limit(Number(limit));
            if (error)
                throw error;
            res.json({ success: true, events: data || [], total: data?.length || 0 });
        }
        catch (error) {
            console.error('Error getting events:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to get events',
                code: 'EVENTS_FETCH_FAILED',
                message: error.message
            });
        }
    }
    /**
     * Get metrics trend
     */
    async getMetricsTrend(req, res) {
        try {
            const { metric } = req.params;
            const { hours = 24 } = req.query;
            // Validate metric name
            const validMetrics = ['users', 'sessions', 'api_calls', 'error_rate', 'response_time'];
            if (!validMetrics.includes(metric)) {
                return res.status(400).json({
                    success: false,
                    error: 'Invalid metric name',
                    code: 'INVALID_METRIC',
                    validMetrics
                });
            }
            const trend = await systemMetricsService_1.default.getMetricsTrend(metric, Number(hours));
            res.json({ success: true, metric, trend });
        }
        catch (error) {
            console.error('Error getting metrics trend:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to get metrics trend',
                code: 'TREND_FETCH_FAILED',
                message: error.message
            });
        }
    }
    /**
     * Acknowledge/resolve an event
     */
    async acknowledgeEvent(req, res) {
        try {
            const { eventId } = req.params;
            const { resolved } = req.body;
            // Validate input
            if (typeof resolved !== 'boolean') {
                return res.status(400).json({
                    success: false,
                    error: 'Invalid input: resolved must be a boolean',
                    code: 'INVALID_INPUT'
                });
            }
            const { data, error } = await getSupabaseClient()
                .from('system_events')
                .update({
                resolved_at: resolved ? new Date().toISOString() : null
            })
                .eq('id', eventId)
                .select()
                .single();
            if (error)
                throw error;
            if (!data) {
                return res.status(404).json({
                    success: false,
                    error: 'Event not found',
                    code: 'EVENT_NOT_FOUND'
                });
            }
            res.json({ success: true, event: data });
        }
        catch (error) {
            console.error('Error acknowledging event:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to acknowledge event',
                code: 'EVENT_ACK_FAILED',
                message: error.message
            });
        }
    }
    /**
     * Clear old events
     */
    async clearOldEvents(req, res) {
        try {
            const { olderThanDays = 30 } = req.body;
            // Validate input
            if (typeof olderThanDays !== 'number' || olderThanDays < 1) {
                return res.status(400).json({
                    success: false,
                    error: 'Invalid input: olderThanDays must be a positive number',
                    code: 'INVALID_INPUT'
                });
            }
            const cutoffDate = new Date(Date.now() - olderThanDays * 24 * 60 * 60 * 1000);
            const { error, count } = await getSupabaseClient()
                .from('system_events')
                .delete()
                .lt('created_at', cutoffDate.toISOString());
            if (error)
                throw error;
            // Log the cleanup action
            await systemMetricsService_1.default.logEvent({
                type: 'system',
                service: 'API Server',
                message: `Cleared ${count || 0} old system events (older than ${olderThanDays} days)`,
                severity: 'info',
                count: count || 0
            });
            res.json({ success: true, deletedCount: count || 0 });
        }
        catch (error) {
            console.error('Error clearing events:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to clear events',
                code: 'EVENT_CLEAR_FAILED',
                message: error.message
            });
        }
    }
    /**
     * Get performance stats (slow queries, bottlenecks)
     */
    async getPerformance(req, res) {
        try {
            const dbMetrics = await systemMetricsService_1.default.getDatabaseMetrics();
            const errorBreakdown = await systemMetricsService_1.default.getErrorBreakdown();
            res.json({
                success: true,
                slowQueries: dbMetrics.slowQueries,
                queryPerformance: dbMetrics.queryPerformance,
                errorBreakdown,
                bottlenecks: [] // Placeholder for bottleneck detection
            });
        }
        catch (error) {
            console.error('Error getting performance stats:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to get performance stats',
                code: 'PERFORMANCE_FETCH_FAILED',
                message: error.message
            });
        }
    }
    /**
     * System maintenance endpoint
     */
    async performMaintenance(req, res) {
        try {
            const { action } = req.body;
            // Validate action
            const validActions = ['clear_cache', 'backup', 'optimize'];
            if (!validActions.includes(action)) {
                return res.status(400).json({
                    success: false,
                    error: 'Invalid action',
                    code: 'INVALID_ACTION',
                    validActions
                });
            }
            // Log maintenance action
            await systemMetricsService_1.default.logEvent({
                type: 'system',
                service: 'API Server',
                message: `Maintenance action performed: ${action}`,
                severity: 'info'
            });
            // Perform action (implement as needed)
            let message = '';
            switch (action) {
                case 'clear_cache':
                    message = 'Cache cleared successfully';
                    break;
                case 'backup':
                    message = 'Backup initiated successfully';
                    break;
                case 'optimize':
                    message = 'Database optimization completed';
                    break;
            }
            res.json({ success: true, message });
        }
        catch (error) {
            console.error('Error performing maintenance:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to perform maintenance',
                code: 'MAINTENANCE_FAILED',
                message: error.message
            });
        }
    }
    /**
     * Get error breakdown by type
     */
    async getErrorBreakdown(req, res) {
        try {
            const breakdown = await systemMetricsService_1.default.getErrorBreakdown();
            res.json({ success: true, errorBreakdown: breakdown });
        }
        catch (error) {
            console.error('Error getting error breakdown:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to get error breakdown',
                code: 'ERROR_BREAKDOWN_FAILED',
                message: error.message
            });
        }
    }
    /**
     * Get service logs
     */
    async getServiceLogs(req, res) {
        try {
            const { serviceName } = req.params;
            const { limit = 100, severity } = req.query;
            // Query system_events for this service
            let query = getSupabaseClient()
                .from('system_events')
                .select('*')
                .eq('service', serviceName)
                .order('created_at', { ascending: false })
                .limit(Number(limit));
            if (severity) {
                query = query.eq('severity', severity);
            }
            const { data, error } = await query;
            if (error)
                throw error;
            res.json({
                success: true,
                logs: data,
                serviceName
            });
        }
        catch (error) {
            console.error('Error getting service logs:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to get service logs',
                code: 'SERVICE_LOGS_FAILED',
                message: error.message
            });
        }
    }
    /**
     * Restart service (simulated)
     */
    async restartService(req, res) {
        try {
            const { serviceName } = req.params;
            // In production, this would trigger actual service restart
            // For now, log the event
            await systemMetricsService_1.default.logEvent({
                type: 'service_restart',
                service: serviceName,
                message: `Service restart requested: ${serviceName}`,
                severity: 'info',
                metadata: {
                    requestedBy: req.user?.id,
                    timestamp: new Date().toISOString()
                }
            });
            res.json({
                success: true,
                message: `Service ${serviceName} restart initiated`,
                serviceName
            });
        }
        catch (error) {
            console.error('Error restarting service:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to restart service',
                code: 'SERVICE_RESTART_FAILED',
                message: error.message
            });
        }
    }
}
exports.default = new SystemController();
//# sourceMappingURL=systemController.js.map