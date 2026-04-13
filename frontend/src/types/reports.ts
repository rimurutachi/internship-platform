export interface ReportOverview {
  total_users: number;
  active_internships: number;
  total_evaluations: number;
  completion_rate: number;
}

export interface MonthlyStat {
  month: string;
  users: number;
  internships: number;
  evaluations: number;
}

export interface UserGrowthPeriod {
  period: string;
  students: number;
  advisors: number;
  supervisors: number;
  admins: number;
}

export interface InternshipStatusItem {
  status: 'pending' | 'active' | 'completed' | 'cancelled';
  count: number;
  percentage: number;
}

export interface ProgramInternshipStatus {
  program_code: string;
  program_name: string;
  pending: number;
  active: number;
  completed: number;
  cancelled: number;
  total: number;
}

export interface InternshipStatusData {
  statuses: InternshipStatusItem[];
  avg_completion_rate: number;
  by_program?: ProgramInternshipStatus[];
}

export interface EvaluationMetrics {
  avg_ratings: {
    overall: number;
    technical: number;
    communication: number;
    work_ethic: number;
  };
  submission_stats: {
    on_time: number;
    late: number;
    pending: number;
  };
  sentiment: {
    positive: number;
    neutral: number;
    negative: number;
  };
  quality_score: number;
}

export interface PerformanceMetrics {
  api_response_time: {
    avg: number;
    p95: number;
    p99: number;
  };
  error_rate: number;
  active_sessions: number;
  slow_queries: Array<{
    endpoint: string;
    response_time_ms: number;
    status_code: number;
  }>;
}

export interface ActivityLogEntry {
  id: string;
  user_id: string;
  user_name: string;
  action: string;
  resource: string;
  description: string;
  timestamp: string;
  entity_type: string;
}

export interface ActivityTimelineData {
  activities: ActivityLogEntry[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface MetricTrend {
  date: string;
  value: number;
}

export interface ExportOptions {
  format: 'csv' | 'json' | 'pdf';
  metrics: string[];
  dateRange?: {
    start?: string;
    end?: string;
  };
  groupBy?: string;
}
