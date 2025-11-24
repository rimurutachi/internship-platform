/**
 * System Management Type Definitions
 * 
 * TypeScript interfaces for system monitoring and metrics
 */

export interface SystemHealth {
  overallHealth: 'healthy' | 'warning' | 'critical';
  uptime: number;
  responseTime: number;
  errorRate: number;
  collectedAt: string;
  databaseHealth?: string;
  databaseResponseTime?: number;
}

export interface ServiceStatus {
  name: string;
  status: 'running' | 'stopped' | 'warning';
  uptime: number; // in days
  memoryUsage: number; // percentage
  cpuUsage: number; // percentage
  lastHealthCheck: string;
}

export interface ApplicationMetrics {
  totalUsers: number;
  activeUsers: number;
  activeSessions: number;
  apiCallsLast24h: number;
  storageUsedGB: number;
  storageQuotaGB: number;
}

export interface DatabaseMetrics {
  connections: number;
  maxConnections: number;
  slowQueries: number;
  queryPerformance: {
    averageTime: number;
    p95Time: number;
    p99Time: number;
  };
}

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

export interface SystemEvent {
  id: string;
  type: string; // 'auth', 'database', 'ai_service', 'socket', 'api', 'system'
  service?: string; // 'API Server', 'Database', 'AI Service', 'Socket Server' - nullable
  message: string;
  error_code?: string; // Error code for tracking
  severity: 'info' | 'warning' | 'error' | 'critical';
  count: number;
  metadata?: Record<string, any>;
  resolved_at?: string;
  created_at: string;
  updated_at?: string;
}

export interface EventFilters {
  limit?: number;
  severity?: 'info' | 'warning' | 'error' | 'critical' | 'all';
  type?: string;
}

export interface MetricsTrend {
  hour: string;
  value: number;
}

export interface PerformanceStats {
  slowQueries: number;
  queryPerformance: {
    averageTime: number;
    p95Time: number;
    p99Time: number;
  };
  errorBreakdown: { [key: string]: number };
  bottlenecks: any[];
}

export interface MaintenanceAction {
  action: 'clear_cache' | 'backup' | 'optimize' | 'restart';
  timestamp?: string;
  performedBy?: string;
}

export interface ErrorBreakdown {
  [key: string]: number;
}

// API Response types
export interface SystemMetricsResponse {
  success: boolean;
  data: SystemMetrics;
}

export interface SystemHealthResponse {
  success: boolean;
  overallHealth: 'healthy' | 'warning' | 'critical';
  uptime: number;
  responseTime: number;
  errorRate: number;
  databaseHealth?: string;
  databaseResponseTime?: number;
}

export interface ServicesResponse {
  success: boolean;
  services: ServiceStatus[];
}

export interface EventsResponse {
  success: boolean;
  events: SystemEvent[];
  total: number;
}

export interface TrendResponse {
  success: boolean;
  metric: string;
  trend: MetricsTrend[];
}

export interface AcknowledgeEventResponse {
  success: boolean;
  event: SystemEvent;
}

export interface ClearEventsResponse {
  success: boolean;
  deletedCount: number;
}

export interface PerformanceResponse {
  success: boolean;
  slowQueries: number;
  queryPerformance: {
    averageTime: number;
    p95Time: number;
    p99Time: number;
  };
  errorBreakdown: ErrorBreakdown;
  bottlenecks: any[];
}

export interface MaintenanceResponse {
  success: boolean;
  message: string;
}

export interface ErrorBreakdownResponse {
  success: boolean;
  errorBreakdown: ErrorBreakdown;
}
