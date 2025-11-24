"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supabase_js_1 = require("@supabase/supabase-js");
const os_1 = __importDefault(require("os"));
const perf_hooks_1 = require("perf_hooks");
// Initialize Supabase client lazily to ensure env vars are loaded
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
// Track server start time for uptime calculation
const serverStartTime = Date.now();
// Store recent response times for average calculation
let recentResponseTimes = [];
const MAX_RESPONSE_TIMES = 100;
// Store error counts
let errorCounts = {};
let totalRequests = 0;
let errorRequests = 0;
// Track active sessions (user_id -> last activity timestamp)
const activeSessions = new Map();
const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes of inactivity
class SystemMetricsService {
    /**
     * Track API request for metrics calculation
     */
    trackRequest(responseTime, isError = false) {
        totalRequests++;
        if (isError)
            errorRequests++;
        // Store response time
        recentResponseTimes.push(responseTime);
        if (recentResponseTimes.length > MAX_RESPONSE_TIMES) {
            recentResponseTimes.shift();
        }
    }
    /**
     * Track user session activity
     */
    trackSession(userId) {
        activeSessions.set(userId, Date.now());
        this.cleanupInactiveSessions();
    }
    /**
     * Remove user session (on logout)
     */
    removeSession(userId) {
        activeSessions.delete(userId);
    }
    /**
     * Remove inactive sessions
     */
    cleanupInactiveSessions() {
        const now = Date.now();
        for (const [userId, lastActivity] of activeSessions.entries()) {
            if (now - lastActivity > SESSION_TIMEOUT) {
                activeSessions.delete(userId);
            }
        }
    }
    /**
     * Get active sessions count
     */
    getActiveSessionsCount() {
        this.cleanupInactiveSessions();
        return activeSessions.size;
    }
    /**
     * Track error by type
     */
    trackError(type) {
        errorCounts[type] = (errorCounts[type] || 0) + 1;
    }
    /**
     * Get overall system metrics
     */
    async getSystemMetrics() {
        try {
            const [healthStatus, services, appMetrics, dbMetrics] = await Promise.all([
                this.getHealthStatus(),
                this.getServiceStatus(),
                this.getApplicationMetrics(),
                this.getDatabaseMetrics()
            ]);
            return {
                overallHealth: healthStatus.overallHealth,
                uptime: healthStatus.uptime,
                responseTime: healthStatus.responseTime,
                errorRate: healthStatus.errorRate,
                services,
                totalUsers: appMetrics.totalUsers,
                activeUsers: appMetrics.activeUsers,
                activeSessions: appMetrics.activeSessions,
                apiCallsLast24h: appMetrics.apiCallsLast24h,
                storageUsedGB: appMetrics.storageUsedGB,
                storageQuotaGB: appMetrics.storageQuotaGB,
                databaseConnections: dbMetrics.connections,
                maxConnections: dbMetrics.maxConnections,
                slowQueries: dbMetrics.slowQueries,
                collectedAt: new Date().toISOString()
            };
        }
        catch (error) {
            console.error('Error collecting system metrics:', error);
            throw error;
        }
    }
    /**
     * Get system health status
     */
    async getHealthStatus() {
        try {
            // Calculate uptime
            const uptimeMs = Date.now() - serverStartTime;
            const uptimeHours = uptimeMs / (1000 * 60 * 60);
            const uptimePercent = Math.min(99.99, 100 - (uptimeHours * 0.001)); // Simple mock calculation
            // Calculate average response time
            const avgResponseTime = recentResponseTimes.length > 0
                ? Math.round(recentResponseTimes.reduce((a, b) => a + b, 0) / recentResponseTimes.length)
                : 45;
            // Calculate error rate
            const errorRate = totalRequests > 0
                ? Number(((errorRequests / totalRequests) * 100).toFixed(2))
                : 0.02;
            // Check database health
            const dbStart = perf_hooks_1.performance.now();
            const { error: dbError } = await getSupabaseClient().from('users').select('count').limit(1);
            const dbResponseTime = perf_hooks_1.performance.now() - dbStart;
            // Determine overall health
            let overallHealth = 'healthy';
            if (dbError || dbResponseTime > 1000 || errorRate > 5) {
                overallHealth = 'critical';
            }
            else if (dbResponseTime > 500 || errorRate > 1 || avgResponseTime > 200) {
                overallHealth = 'warning';
            }
            return {
                overallHealth,
                uptime: Number(uptimePercent.toFixed(2)),
                responseTime: avgResponseTime,
                errorRate,
                databaseHealth: dbError ? 'unhealthy' : 'healthy',
                databaseResponseTime: Math.round(dbResponseTime)
            };
        }
        catch (error) {
            console.error('Error checking health status:', error);
            return {
                overallHealth: 'critical',
                uptime: 0,
                responseTime: 0,
                errorRate: 100,
                databaseHealth: 'unhealthy',
                databaseResponseTime: 0
            };
        }
    }
    /**
     * Get service status
     */
    async getServiceStatus() {
        const services = [];
        const now = new Date().toISOString();
        // API Server
        const apiUptime = (Date.now() - serverStartTime) / (1000 * 60 * 60 * 24);
        const memoryUsage = (process.memoryUsage().heapUsed / process.memoryUsage().heapTotal) * 100;
        services.push({
            name: 'API Server',
            status: 'running',
            uptime: Number(apiUptime.toFixed(1)),
            memoryUsage: Number(memoryUsage.toFixed(1)),
            cpuUsage: Number((os_1.default.loadavg()[0] * 10).toFixed(1)), // Approximate CPU usage
            lastHealthCheck: now
        });
        // Database
        try {
            const dbStart = perf_hooks_1.performance.now();
            const { error } = await getSupabaseClient().from('users').select('count').limit(1);
            const dbResponseTime = perf_hooks_1.performance.now() - dbStart;
            services.push({
                name: 'Database',
                status: error || dbResponseTime > 1000 ? 'warning' : 'running',
                uptime: Number(apiUptime.toFixed(1)), // Use same as API server
                memoryUsage: 0, // Would need server-side access
                cpuUsage: 0,
                lastHealthCheck: now
            });
        }
        catch (error) {
            services.push({
                name: 'Database',
                status: 'stopped',
                uptime: 0,
                memoryUsage: 0,
                cpuUsage: 0,
                lastHealthCheck: now
            });
        }
        // AI Service
        try {
            const aiServiceUrl = process.env.AI_SERVICE_URL || 'http://localhost:8000';
            const response = await fetch(`${aiServiceUrl}/health`, {
                method: 'GET',
                signal: AbortSignal.timeout(5000)
            });
            services.push({
                name: 'AI Service',
                status: response.ok ? 'running' : 'warning',
                uptime: Number(apiUptime.toFixed(1)),
                memoryUsage: 0,
                cpuUsage: 0,
                lastHealthCheck: now
            });
        }
        catch (error) {
            services.push({
                name: 'AI Service',
                status: 'stopped',
                uptime: 0,
                memoryUsage: 0,
                cpuUsage: 0,
                lastHealthCheck: now
            });
        }
        // Socket Server
        services.push({
            name: 'Socket Server',
            status: 'running', // Assume running if API is running
            uptime: Number(apiUptime.toFixed(1)),
            memoryUsage: Number((memoryUsage * 0.3).toFixed(1)), // Estimate
            cpuUsage: Number((os_1.default.loadavg()[0] * 5).toFixed(1)),
            lastHealthCheck: now
        });
        return services;
    }
    /**
     * Get application metrics
     */
    async getApplicationMetrics() {
        try {
            // Count total users
            const { count: totalUsers, error: usersError } = await getSupabaseClient()
                .from('users')
                .select('*', { count: 'exact', head: true });
            // Count active users (logged in within last 24 hours)
            const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
            const { count: activeUsers, error: activeError } = await getSupabaseClient()
                .from('users')
                .select('*', { count: 'exact', head: true })
                .gte('last_sign_in_at', oneDayAgo);
            // Get active sessions count from in-memory tracker
            const activeSessionsCount = this.getActiveSessionsCount();
            // API calls in last 24h - query actual request logs
            let apiCallsLast24h = 0;
            try {
                const { count: apiCount } = await getSupabaseClient()
                    .from('api_request_logs')
                    .select('*', { count: 'exact', head: true })
                    .gte('created_at', oneDayAgo);
                apiCallsLast24h = apiCount || 0;
            }
            catch (error) {
                // Table might not exist yet, use tracked requests
                apiCallsLast24h = totalRequests > 0 ? totalRequests : 0;
            }
            // Storage - would need to query Supabase Storage API
            const storageUsedGB = 0; // Placeholder
            const storageQuotaGB = 100; // Placeholder
            return {
                totalUsers: totalUsers || 0,
                activeUsers: activeUsers || 0,
                activeSessions: activeSessionsCount,
                apiCallsLast24h,
                storageUsedGB,
                storageQuotaGB
            };
        }
        catch (error) {
            console.error('Error getting application metrics:', error);
            return {
                totalUsers: 0,
                activeUsers: 0,
                activeSessions: 0,
                apiCallsLast24h: 0,
                storageUsedGB: 0,
                storageQuotaGB: 100
            };
        }
    }
    /**
     * Get database metrics
     */
    async getDatabaseMetrics() {
        try {
            // For Supabase, we can query pg_stat_database and pg_stat_activity
            // Note: This requires appropriate permissions
            // Query current connections
            // For now, return mock data if RPC not set up
            const currentConnections = 15;
            const maxConnections = 100;
            // Slow queries - would need pg_stat_statements extension
            const slowQueries = 0;
            return {
                connections: currentConnections,
                maxConnections,
                slowQueries,
                queryPerformance: {
                    averageTime: recentResponseTimes.length > 0
                        ? Math.round(recentResponseTimes.reduce((a, b) => a + b, 0) / recentResponseTimes.length)
                        : 45,
                    p95Time: this.calculatePercentile(recentResponseTimes, 0.95),
                    p99Time: this.calculatePercentile(recentResponseTimes, 0.99)
                }
            };
        }
        catch (error) {
            console.error('Error getting database metrics:', error);
            return {
                connections: 0,
                maxConnections: 100,
                slowQueries: 0,
                queryPerformance: {
                    averageTime: 0,
                    p95Time: 0,
                    p99Time: 0
                }
            };
        }
    }
    /**
     * Get recent system events
     */
    async getRecentEvents(limit = 20, severity, type) {
        try {
            let query = getSupabaseClient()
                .from('system_events')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(limit);
            if (severity) {
                query = query.eq('severity', severity);
            }
            if (type) {
                query = query.eq('type', type);
            }
            const { data, error } = await query;
            if (error)
                throw error;
            return data || [];
        }
        catch (error) {
            console.error('Error getting recent events:', error);
            return [];
        }
    }
    /**
     * Log a system event
     */
    async logEvent(event) {
        try {
            const { error } = await getSupabaseClient().from('system_events').insert({
                type: event.type,
                service: event.service || null,
                message: event.message,
                error_code: event.error_code || null,
                severity: event.severity,
                count: event.count || 1,
                metadata: event.metadata || {}
            });
            if (error)
                throw error;
        }
        catch (error) {
            console.error('Error logging system event:', error);
        }
    }
    /**
     * Get error breakdown
     */
    async getErrorBreakdown() {
        try {
            const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
            const { data, error } = await getSupabaseClient()
                .from('system_events')
                .select('type, count')
                .in('severity', ['error', 'critical'])
                .gte('created_at', oneDayAgo);
            if (error)
                throw error;
            const breakdown = {};
            data?.forEach(event => {
                breakdown[event.type] = (breakdown[event.type] || 0) + event.count;
            });
            return breakdown;
        }
        catch (error) {
            console.error('Error getting error breakdown:', error);
            return {};
        }
    }
    /**
     * Get metrics trend
     */
    async getMetricsTrend(metric, hours = 24) {
        try {
            // This would query the system_metrics_history table if implemented
            // For now, return mock trend data
            const trend = [];
            const now = Date.now();
            for (let i = hours; i >= 0; i--) {
                const timestamp = new Date(now - i * 60 * 60 * 1000);
                const value = this.generateMockTrendValue(metric, i);
                trend.push({
                    hour: timestamp.toISOString(),
                    value
                });
            }
            return trend;
        }
        catch (error) {
            console.error('Error getting metrics trend:', error);
            return [];
        }
    }
    /**
     * Calculate percentile
     */
    calculatePercentile(values, percentile) {
        if (values.length === 0)
            return 0;
        const sorted = [...values].sort((a, b) => a - b);
        const index = Math.ceil(sorted.length * percentile) - 1;
        return Math.round(sorted[index] || 0);
    }
    /**
     * Generate mock trend value (temporary until historical tracking is implemented)
     */
    generateMockTrendValue(metric, hoursAgo) {
        const baseValues = {
            users: 150,
            sessions: 45,
            api_calls: 1200,
            error_rate: 0.5,
            response_time: 50
        };
        const base = baseValues[metric] || 100;
        const variance = Math.random() * 0.2 - 0.1; // ±10% variance
        return Math.round(base * (1 + variance));
    }
}
exports.default = new SystemMetricsService();
//# sourceMappingURL=systemMetricsService.js.map