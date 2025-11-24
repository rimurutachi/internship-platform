/**
 * Admin System Management API Client
 * 
 * Handles all system monitoring, metrics, and management endpoints
 */

import { apiClient } from './client';

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
  service?: string; // Nullable
  message: string;
  error_code?: string; // Added
  severity: 'info' | 'warning' | 'error' | 'critical';
  count: number;
  resolved_at?: string;
  created_at: string;
}

export interface EventFilters {
  limit?: number;
  severity?: string;
  type?: string;
}

export interface MetricsTrend {
  hour: string;
  value: number;
}

/**
 * Admin System Management API
 */
export const adminSystemAPI = {
  /**
   * Get overall system metrics
   */
  getMetrics: async () => {
    try {
      const response = await apiClient.get<{ success: boolean; data: SystemMetrics }>('/admin/system/metrics');
      return response.data;
    } catch (error: any) {
      console.error('Failed to fetch system metrics:', error);
      throw new Error(error.response?.data?.error || 'Failed to fetch system metrics');
    }
  },

  /**
   * Get health status
   */
  getHealth: async () => {
    try {
      const response = await apiClient.get('/admin/system/health');
      return response.data;
    } catch (error: any) {
      console.error('Failed to fetch system health:', error);
      throw new Error(error.response?.data?.error || 'Failed to fetch system health');
    }
  },

  /**
   * Get services status
   */
  getServices: async () => {
    try {
      const response = await apiClient.get<{ success: boolean; services: ServiceStatus[] }>('/admin/system/services');
      return response.data;
    } catch (error: any) {
      console.error('Failed to fetch service status:', error);
      throw new Error(error.response?.data?.error || 'Failed to fetch service status');
    }
  },

  /**
   * Get application metrics
   */
  getApplicationMetrics: async () => {
    try {
      const response = await apiClient.get('/admin/system/application');
      return response.data;
    } catch (error: any) {
      console.error('Failed to fetch application metrics:', error);
      throw new Error(error.response?.data?.error || 'Failed to fetch application metrics');
    }
  },

  /**
   * Get database metrics
   */
  getDatabaseMetrics: async () => {
    try {
      const response = await apiClient.get('/admin/system/database');
      return response.data;
    } catch (error: any) {
      console.error('Failed to fetch database metrics:', error);
      throw new Error(error.response?.data?.error || 'Failed to fetch database metrics');
    }
  },

  /**
   * Get recent system events
   */
  getEvents: async (filters?: EventFilters) => {
    try {
      const params = new URLSearchParams();
      
      if (filters?.limit) {
        params.append('limit', filters.limit.toString());
      }
      
      if (filters?.severity) {
        params.append('severity', filters.severity);
      }
      
      if (filters?.type) {
        params.append('type', filters.type);
      }

      const queryString = params.toString();
      const url = queryString ? `/admin/system/events?${queryString}` : '/admin/system/events';
      
      const response = await apiClient.get<{ success: boolean; events: SystemEvent[]; total: number }>(url);
      return response.data;
    } catch (error: any) {
      console.error('Failed to fetch system events:', error);
      throw new Error(error.response?.data?.error || 'Failed to fetch system events');
    }
  },

  /**
   * Get metrics trend for charts
   */
  getTrend: async (metric: string, hours: number = 24) => {
    try {
      const response = await apiClient.get<{ success: boolean; metric: string; trend: MetricsTrend[] }>(
        `/admin/system/metrics/trend/${metric}?hours=${hours}`
      );
      return response.data;
    } catch (error: any) {
      console.error(`Failed to fetch ${metric} trend:`, error);
      throw new Error(error.response?.data?.error || `Failed to fetch ${metric} trend`);
    }
  },

  /**
   * Acknowledge/resolve an event
   */
  acknowledgeEvent: async (eventId: string, resolved: boolean) => {
    try {
      const response = await apiClient.patch<{ success: boolean; event: SystemEvent }>(
        `/admin/system/events/${eventId}`,
        { resolved }
      );
      return response.data;
    } catch (error: any) {
      console.error('Failed to acknowledge event:', error);
      throw new Error(error.response?.data?.error || 'Failed to acknowledge event');
    }
  },

  /**
   * Clear old events
   */
  clearOldEvents: async (olderThanDays: number = 30) => {
    try {
      const response = await apiClient.post<{ success: boolean; deletedCount: number }>(
        '/admin/system/events/clear',
        { olderThanDays }
      );
      return response.data;
    } catch (error: any) {
      console.error('Failed to clear old events:', error);
      throw new Error(error.response?.data?.error || 'Failed to clear old events');
    }
  },

  /**
   * Get performance stats
   */
  getPerformance: async () => {
    try {
      const response = await apiClient.get('/admin/system/performance');
      return response.data;
    } catch (error: any) {
      console.error('Failed to fetch performance stats:', error);
      throw new Error(error.response?.data?.error || 'Failed to fetch performance stats');
    }
  },

  /**
   * Perform maintenance action
   */
  performMaintenance: async (action: 'clear_cache' | 'backup' | 'optimize') => {
    try {
      const response = await apiClient.post<{ success: boolean; message: string }>(
        '/admin/system/maintenance',
        { action }
      );
      return response.data;
    } catch (error: any) {
      console.error('Failed to perform maintenance:', error);
      throw new Error(error.response?.data?.error || 'Failed to perform maintenance');
    }
  },

  /**
   * Get error breakdown by type
   */
  getErrorBreakdown: async () => {
    try {
      const response = await apiClient.get<{ success: boolean; errorBreakdown: { [key: string]: number } }>(
        '/admin/system/errors'
      );
      return response.data;
    } catch (error: any) {
      console.error('Failed to fetch error breakdown:', error);
      throw new Error(error.response?.data?.error || 'Failed to fetch error breakdown');
    }
  },

  /**
   * Get service logs
   */
  getServiceLogs: async (serviceName: string, filters?: { limit?: number; severity?: string }) => {
    try {
      const params = new URLSearchParams();
      if (filters?.limit) params.append('limit', filters.limit.toString());
      if (filters?.severity) params.append('severity', filters.severity);

      const response = await apiClient.get<{ success: boolean; logs: SystemEvent[]; serviceName: string }>(
        `/admin/system/services/${serviceName}/logs?${params.toString()}`
      );
      return response.data;
    } catch (error: any) {
      console.error('Failed to fetch service logs:', error);
      throw new Error(error.response?.data?.error || 'Failed to fetch service logs');
    }
  },

  /**
   * Restart service
   */
  restartService: async (serviceName: string) => {
    try {
      const response = await apiClient.post<{ success: boolean; message: string; serviceName: string }>(
        `/admin/system/services/${serviceName}/restart`
      );
      return response.data;
    } catch (error: any) {
      console.error('Failed to restart service:', error);
      throw new Error(error.response?.data?.error || 'Failed to restart service');
    }
  }
};

export default adminSystemAPI;
