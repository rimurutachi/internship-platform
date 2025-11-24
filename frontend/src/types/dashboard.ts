// Dashboard KPI Metrics
export interface DashboardKPI {
  total_users: number;
  system_uptime: number;
  response_time: number;
  cpu_usage: number;
  active_internships: number;
  security_alerts_24h: number;
}

// Platform Usage & Engagement Data
export interface UsageEngagementData {
  month: string;
  students: number;
  advisors: number;
  supervisors: number;
  admins: number;
}

// System Performance Metrics
export interface PerformanceMetric {
  time: string;
  response_time: number;
  cpu_usage: number;
  ai_processing: number;
}

// Feature Usage Analytics
export interface FeatureUsage {
  feature: string;
  usage_percent: number;
}

// Complete Dashboard Data
export interface DashboardData {
  kpis: DashboardKPI;
  usage_engagement: UsageEngagementData[];
  performance_metrics: PerformanceMetric[];
  feature_usage: FeatureUsage[];
}

// API Response Types
export interface DashboardAPIResponse<T> {
  success: boolean;
  data: T;
  error?: string;
}
