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
import { createSupabaseClient } from '@/lib/supabase';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

// Helper function to get auth headers
async function getAuthHeaders(): Promise<HeadersInit> {
  const supabase = createSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  
  return {
    'Content-Type': 'application/json',
    ...(session?.access_token && {
      Authorization: `Bearer ${session.access_token}`,
    }),
  };
}

export const adminReportsAPI = {
  // Get overview stats
  getOverview: async (): Promise<ReportOverview> => {
    const response = await fetch(`${API_BASE_URL}/api/admin/reports/overview`, {
      method: 'GET',
      headers: await getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch overview');
    return response.json();
  },

  // Get monthly stats
  getMonthlyStats: async (months = 12): Promise<{ data: MonthlyStat[] }> => {
    const response = await fetch(`${API_BASE_URL}/api/admin/reports/monthly-stats?months=${months}`, {
      method: 'GET',
      headers: await getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch monthly stats');
    return response.json();
  },

  // Get user growth by role
  getUserGrowth: async (groupBy = 'month', periods = 12): Promise<{ data: UserGrowthPeriod[] }> => {
    const response = await fetch(`${API_BASE_URL}/api/admin/reports/user-growth?groupBy=${groupBy}&periods=${periods}`, {
      method: 'GET',
      headers: await getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch user growth');
    return response.json();
  },

  // Get internship status breakdown
  getInternshipStatus: async (groupBy = 'status'): Promise<InternshipStatusData> => {
    const response = await fetch(`${API_BASE_URL}/api/admin/reports/internship-status?groupBy=${groupBy}`, {
      method: 'GET',
      headers: await getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch internship status');
    return response.json();
  },

  // Get evaluation metrics
  getEvaluationMetrics: async (dateRange?: { start?: string; end?: string }): Promise<EvaluationMetrics> => {
    let url = `${API_BASE_URL}/api/admin/reports/evaluation-metrics`;
    if (dateRange) {
      const params = new URLSearchParams();
      if (dateRange.start) params.append('dateRange[start]', dateRange.start);
      if (dateRange.end) params.append('dateRange[end]', dateRange.end);
      url += `?${params.toString()}`;
    }
    const response = await fetch(url, {
      method: 'GET',
      headers: await getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch evaluation metrics');
    return response.json();
  },

  // Get performance metrics
  getPerformance: async (): Promise<PerformanceMetrics> => {
    const response = await fetch(`${API_BASE_URL}/api/admin/reports/performance`, {
      method: 'GET',
      headers: await getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch performance metrics');
    return response.json();
  },

  // Get activity timeline
  getActivityTimeline: async (timeframe = '24h', page = 1, limit = 20): Promise<ActivityTimelineData> => {
    const response = await fetch(`${API_BASE_URL}/api/admin/reports/activity-timeline?timeframe=${timeframe}&page=${page}&limit=${limit}`, {
      method: 'GET',
      headers: await getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch activity timeline');
    return response.json();
  },

  // Get metric trend
  getTrend: async (metric: string, days = 30): Promise<{ metric: string; trend: MetricTrend[] }> => {
    const response = await fetch(`${API_BASE_URL}/api/admin/reports/trends/${metric}?days=${days}`, {
      method: 'GET',
      headers: await getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch metric trend');
    return response.json();
  },

  // Export report
  exportReport: async (options: ExportOptions): Promise<Blob> => {
    const response = await fetch(`${API_BASE_URL}/api/admin/reports/export`, {
      method: 'POST',
      headers: await getAuthHeaders(),
      body: JSON.stringify(options),
    });
    if (!response.ok) throw new Error('Failed to export report');
    return response.blob();
  },
};
