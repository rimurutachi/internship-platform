import {
  DashboardKPI,
  UsageEngagementData,
  PerformanceMetric,
  FeatureUsage,
  DashboardData,
  DashboardAPIResponse
} from '@/types/dashboard';
import { createSupabaseClient } from '@/lib/supabase';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

/**
 * Get authentication headers with Bearer token
 */
const getAuthHeaders = async () => {
  const supabase = createSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  
  return {
    'Content-Type': 'application/json',
    ...(session?.access_token && { 'Authorization': `Bearer ${session.access_token}` }),
  };
};

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
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/admin/dashboard/kpis`, {
        method: 'GET',
        headers,
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch KPIs: ${response.statusText}`);
      }

      const result: DashboardAPIResponse<DashboardKPI> = await response.json();
      return result.data;
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
      const headers = await getAuthHeaders();
      const response = await fetch(
        `${API_BASE_URL}/admin/dashboard/usage-engagement?months=${months}`,
        {
          method: 'GET',
          headers,
          credentials: 'include',
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch usage engagement: ${response.statusText}`);
      }

      const result: DashboardAPIResponse<UsageEngagementData[]> = await response.json();
      return result.data;
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
      const headers = await getAuthHeaders();
      const response = await fetch(
        `${API_BASE_URL}/admin/dashboard/performance-metrics?hours=${hours}`,
        {
          method: 'GET',
          headers,
          credentials: 'include',
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch performance metrics: ${response.statusText}`);
      }

      const result: DashboardAPIResponse<PerformanceMetric[]> = await response.json();
      return result.data;
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
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/admin/dashboard/feature-usage`, {
        method: 'GET',
        headers,
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch feature usage: ${response.statusText}`);
      }

      const result: DashboardAPIResponse<FeatureUsage[]> = await response.json();
      return result.data;
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
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/admin/dashboard/overview`, {
        method: 'GET',
        headers,
        credentials: 'include',
      });

      if (!response.ok) {
        const text = await response.text();
        console.error('Dashboard API Error Response:', text);
        throw new Error(`Failed to fetch dashboard overview: ${response.status} ${response.statusText}`);
      }

      // Check if response is JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('Non-JSON response received:', text);
        throw new Error('Server returned non-JSON response');
      }

      const result: DashboardAPIResponse<DashboardData> = await response.json();
      return result.data;
    } catch (error) {
      console.error('Error fetching dashboard overview:', error);
      throw error;
    }
  },
};
