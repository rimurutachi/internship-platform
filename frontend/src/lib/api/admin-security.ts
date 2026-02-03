import { apiClient } from './client';
import { AuditLog, SecurityAlert, LoginAttempt, SecuritySettings, SecurityHealth } from '../../types/security';

const API_BASE = '/admin/security';

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface AuditLogFilters {
  page?: number;
  limit?: number;
  user_id?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
}

interface AlertFilters {
  page?: number;
  limit?: number;
  severity?: 'low' | 'medium' | 'high' | 'critical';
  resolved?: boolean;
}

interface LoginAttemptFilters {
  page?: number;
  limit?: number;
  success?: boolean;
  email?: string;
  startDate?: string;
  endDate?: string;
}

interface ExportFilters {
  startDate?: string;
  endDate?: string;
  user_id?: string;
  status?: string;
}

interface SecurityOverview {
  overall_status: 'healthy' | 'warning' | 'critical';
  encryption: boolean;
  https_status: boolean;
  active_alerts_count: number;
  recent_events: Array<{ type: string; message: string; created_at: string }>;
}

export const adminSecurityAPI = {
  getOverview: async (): Promise<SecurityOverview> => {
    return apiClient.get(`${API_BASE}/overview`).then(res => res.data);
  },

  getAuditLogs: async (filters: AuditLogFilters): Promise<{ logs: AuditLog[]; pagination: Pagination; total: number }> => {
    return apiClient.get(`${API_BASE}/audit-logs`, { params: filters }).then(res => res.data);
  },

  getApiLogs: async (filters: AuditLogFilters): Promise<{ logs: AuditLog[]; pagination: Pagination; total: number }> => {
    return apiClient.get(`${API_BASE}/api-logs`, { params: filters }).then(res => res.data);
  },

  getAlerts: async (filters: AlertFilters): Promise<{ alerts: SecurityAlert[]; pagination: Pagination; total: number }> => {
    return apiClient.get(`${API_BASE}/alerts`, { params: filters }).then(res => res.data);
  },

  acknowledgeAlert: async (alertId: string, notes: string): Promise<SecurityAlert> => {
    return apiClient.patch(`${API_BASE}/alerts/${alertId}`, { acknowledged: true, notes }).then(res => res.data.alert);
  },

  getLoginAttempts: async (filters: LoginAttemptFilters): Promise<{ attempts: LoginAttempt[]; pagination: Pagination; total: number }> => {
    return apiClient.get(`${API_BASE}/login-attempts`, { params: filters }).then(res => res.data);
  },

  getSettings: async (): Promise<SecuritySettings> => {
    return apiClient.get(`${API_BASE}/settings`).then(res => res.data.settings);
  },

  updateSettings: async (settings: Partial<SecuritySettings>): Promise<SecuritySettings> => {
    return apiClient.patch(`${API_BASE}/settings`, settings).then(res => res.data.settings);
  },

  getHealthStatus: async (): Promise<SecurityHealth> => {
    return apiClient.get(`${API_BASE}/health-status`).then(res => res.data);
  },

  exportAuditLogs: async (filters: ExportFilters, format: 'csv' | 'json'): Promise<Blob> => {
    return apiClient.post(`${API_BASE}/export/audit-logs`, { format, filters }, { responseType: 'blob' }).then(res => res.data);
  },
};
