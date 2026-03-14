// OJT Dashboard Metrics (currently used)
export interface OJTDashboardMetrics {
  students_enrolled: number;
  students_pending_deployment: number;
  active_internships: number;
  completed_internships: number;
  total_companies: number;
  companies_with_capacity: number;
  total_daily_reports: number;
  pending_supervisor_evaluations: number;
  pending_advisor_evaluations: number;
  completed_evaluations_this_month: number;
  timestamp: string;
}

// API Response Types
export interface DashboardAPIResponse<T> {
  success: boolean;
  data: T;
  error?: string;
}
