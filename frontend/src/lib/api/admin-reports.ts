import {
  ReportOverview,
  MonthlyStat,
  UserGrowthPeriod,
  InternshipStatusData,
  EvaluationMetrics,
  PerformanceMetrics,
  ActivityTimelineData,
  MetricTrend,
  ExportOptions,
} from '@/types/reports';
import { apiClient } from './client';

export const adminReportsAPI = {
  // Get overview stats
  getOverview: async (dateRange?: { start?: string; end?: string }): Promise<ReportOverview> => {
    let url = '/admin/reports/overview';
    if (dateRange) {
      const params = new URLSearchParams();
      if (dateRange.start) params.append('start', dateRange.start);
      if (dateRange.end) params.append('end', dateRange.end);
      if (params.toString()) url += `?${params.toString()}`;
    }
    const response = await apiClient.get(url);
    return response.data;
  },

  // Get monthly stats
  getMonthlyStats: async (months = 12): Promise<{ data: MonthlyStat[] }> => {
    const response = await apiClient.get(`/admin/reports/monthly-stats?months=${months}`);
    return response.data;
  },

  // Get user growth by role
  getUserGrowth: async (groupBy = 'month', periods = 12): Promise<{ data: UserGrowthPeriod[] }> => {
    const response = await apiClient.get(`/admin/reports/user-growth?groupBy=${groupBy}&periods=${periods}`);
    return response.data;
  },

  // Get internship status breakdown
  getInternshipStatus: async (groupBy = 'status', dateRange?: { start?: string; end?: string }): Promise<InternshipStatusData> => {
    let url = `/admin/reports/internship-status?groupBy=${groupBy}`;
    if (dateRange) {
      if (dateRange.start) url += `&start=${encodeURIComponent(dateRange.start)}`;
      if (dateRange.end) url += `&end=${encodeURIComponent(dateRange.end)}`;
    }
    const response = await apiClient.get(url);
    return response.data;
  },

  // Get evaluation metrics
  getEvaluationMetrics: async (dateRange?: { start?: string; end?: string }): Promise<EvaluationMetrics> => {
    let url = '/admin/reports/evaluation-metrics';
    if (dateRange) {
      const params = new URLSearchParams();
      if (dateRange.start) params.append('dateRange[start]', dateRange.start);
      if (dateRange.end) params.append('dateRange[end]', dateRange.end);
      url += `?${params.toString()}`;
    }
    const response = await apiClient.get(url);
    return response.data;
  },

  // Get performance metrics
  getPerformance: async (): Promise<PerformanceMetrics> => {
    const response = await apiClient.get('/admin/reports/performance');
    return response.data;
  },

  // Get activity timeline
  getActivityTimeline: async (timeframe = '24h', page = 1, limit = 20): Promise<ActivityTimelineData> => {
    const response = await apiClient.get(`/admin/reports/activity-timeline?timeframe=${timeframe}&page=${page}&limit=${limit}`);
    return response.data;
  },

  // Get metric trend
  getTrend: async (metric: string, days = 30): Promise<{ metric: string; trend: MetricTrend[] }> => {
    const response = await apiClient.get(`/admin/reports/trends/${metric}?days=${days}`);
    return response.data;
  },

  // Export report
  exportReport: async (options: ExportOptions): Promise<Blob> => {
    const response = await apiClient.post('/admin/reports/export', options, {
      responseType: 'blob',
    });
    return response.data;
  },
};
