import {
  DashboardKPI,
  UsageEngagementData,
  PerformanceMetric,
  FeatureUsage,
  DashboardData,
  DashboardAPIResponse
} from '@/types/dashboard';
import { apiClient } from './client';

/**
 * Admin Dashboard API Client
 * Handles all dashboard data fetching
 */
export const adminDashboardAPI = {
  /**
   * Get all KPI metrics for dashboard cards
   */
  getKPIs: async (): Promise<DashboardKPI> => {
    try {
      const response = await apiClient.get<DashboardAPIResponse<DashboardKPI>>('/admin/dashboard/kpis');
      return response.data.data;
    } catch (error) {
      console.error('Error fetching KPIs:', error);
      throw error;
    }
  },

  /**
   * Get user growth by role over months
   * @param months - Number of months to fetch (default: 6)
   */
  getUsageEngagement: async (months: number = 6): Promise<UsageEngagementData[]> => {
    try {
      const response = await apiClient.get<DashboardAPIResponse<UsageEngagementData[]>>(
        `/admin/dashboard/usage-engagement?months=${months}`
      );
      return response.data.data;
    } catch (error) {
      console.error('Error fetching usage engagement:', error);
      throw error;
    }
  },

  /**
   * Get system performance metrics over hours
   * @param hours - Number of hours to fetch (default: 24)
   */
  getPerformanceMetrics: async (hours: number = 24): Promise<PerformanceMetric[]> => {
    try {
      const response = await apiClient.get<DashboardAPIResponse<PerformanceMetric[]>>(
        `/admin/dashboard/performance-metrics?hours=${hours}`
      );
      return response.data.data;
    } catch (error) {
      console.error('Error fetching performance metrics:', error);
      throw error;
    }
  },

  /**
   * Get feature usage analytics
   */
  getFeatureUsage: async (): Promise<FeatureUsage[]> => {
    try {
      const response = await apiClient.get<DashboardAPIResponse<FeatureUsage[]>>(
        '/admin/dashboard/feature-usage'
      );
      return response.data.data;
    } catch (error) {
      console.error('Error fetching feature usage:', error);
      throw error;
    }
  },

  /**
   * Get complete dashboard overview (all data in one call)
   */
  getDashboardOverview: async (): Promise<DashboardData> => {
    try {
      const response = await apiClient.get<DashboardAPIResponse<DashboardData>>(
        '/admin/dashboard/overview'
      );
      return response.data.data;
    } catch (error) {
      console.error('Error fetching dashboard overview:', error);
      throw error;
    }
  },
};
