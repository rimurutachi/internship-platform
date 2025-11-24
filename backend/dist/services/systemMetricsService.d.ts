export interface SystemMetrics {
    overallHealth: 'healthy' | 'warning' | 'critical';
    uptime: number;
    responseTime: number;
    errorRate: number;
    services: ServiceStatus[];
    totalUsers: number;
    activeUsers: number;
    activeSessions: number;
    apiCallsLast24h: number;
    storageUsedGB: number;
    storageQuotaGB: number;
    databaseConnections: number;
    maxConnections: number;
    slowQueries: number;
    collectedAt: string;
}
export interface ServiceStatus {
    name: string;
    status: 'running' | 'stopped' | 'warning';
    uptime: number;
    memoryUsage: number;
    cpuUsage: number;
    lastHealthCheck: string;
}
export interface SystemEvent {
    id: string;
    type: string;
    service?: string;
    message: string;
    error_code?: string;
    severity: 'info' | 'warning' | 'error' | 'critical';
    count: number;
    metadata?: any;
    resolved_at?: string;
    created_at: string;
}
declare class SystemMetricsService {
    /**
     * Track API request for metrics calculation
     */
    trackRequest(responseTime: number, isError?: boolean): void;
    /**
     * Track user session activity
     */
    trackSession(userId: string): void;
    /**
     * Remove user session (on logout)
     */
    removeSession(userId: string): void;
    /**
     * Remove inactive sessions
     */
    private cleanupInactiveSessions;
    /**
     * Get active sessions count
     */
    getActiveSessionsCount(): number;
    /**
     * Track error by type
     */
    trackError(type: string): void;
    /**
     * Get overall system metrics
     */
    getSystemMetrics(): Promise<SystemMetrics>;
    /**
     * Get system health status
     */
    getHealthStatus(): Promise<{
        overallHealth: "healthy" | "warning" | "critical";
        uptime: number;
        responseTime: number;
        errorRate: number;
        databaseHealth: string;
        databaseResponseTime: number;
    }>;
    /**
     * Get service status
     */
    getServiceStatus(): Promise<ServiceStatus[]>;
    /**
     * Get application metrics
     */
    getApplicationMetrics(): Promise<{
        totalUsers: number;
        activeUsers: number;
        activeSessions: number;
        apiCallsLast24h: number;
        storageUsedGB: number;
        storageQuotaGB: number;
    }>;
    /**
     * Get database metrics
     */
    getDatabaseMetrics(): Promise<{
        connections: number;
        maxConnections: number;
        slowQueries: number;
        queryPerformance: {
            averageTime: number;
            p95Time: number;
            p99Time: number;
        };
    }>;
    /**
     * Get recent system events
     */
    getRecentEvents(limit?: number, severity?: string, type?: string): Promise<SystemEvent[]>;
    /**
     * Log a system event
     */
    logEvent(event: {
        type: string;
        service?: string;
        message: string;
        error_code?: string;
        severity: 'info' | 'warning' | 'error' | 'critical';
        count?: number;
        metadata?: any;
    }): Promise<void>;
    /**
     * Get error breakdown
     */
    getErrorBreakdown(): Promise<{
        [key: string]: number;
    }>;
    /**
     * Get metrics trend
     */
    getMetricsTrend(metric: string, hours?: number): Promise<{
        hour: string;
        value: number;
    }[]>;
    /**
     * Calculate percentile
     */
    private calculatePercentile;
    /**
     * Generate mock trend value (temporary until historical tracking is implemented)
     */
    private generateMockTrendValue;
}
declare const _default: SystemMetricsService;
export default _default;
//# sourceMappingURL=systemMetricsService.d.ts.map