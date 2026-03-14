/* eslint-disable @typescript-eslint/no-explicit-any */
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

/**
 * Get authentication token from Supabase session
 */
const getAuthToken = async (): Promise<string | null> => {
  if (typeof window === 'undefined') return null;
  
  try {
    const { createSupabaseClient } = await import('@/lib/supabase');
    const supabase = createSupabaseClient();
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token || null;
  } catch (error) {
    console.error('Error getting auth token:', error);
    return null;
  }
};

/**
 * Make authenticated API request
 */
async function fetchAPI<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = await getAuthToken();

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({
      error: 'Request failed',
      message: response.statusText,
    }));
    throw new Error(error.error || error.message || 'Request failed');
  }

  return response.json();
}

interface EvaluationFilters {
  page?: number;
  limit?: number;
  status?: string;
  supervisor_id?: string;
  company_id?: string;
  date_range?: { start: string; end: string };
  search?: string;
}

interface ApproveEvaluationData {
  final_grade?: number;
  notes?: string;
  use_ai_grade?: boolean;
}

interface OverrideGradeData {
  new_grade: number;
  reason: string;
}

interface RejectEvaluationData {
  reason: string;
  comments: string;
}

interface ValidateSentimentData {
  is_accurate: boolean;
  notes?: string;
}

interface ValidateFeaturesData {
  is_correct: boolean;
  corrections?: string;
}

interface ValidateBiasData {
  passed: boolean;
  reason?: string;
}

interface RequestReprocessData {
  reason?: string;
}

interface BulkApproveData {
  evaluation_ids: string[];
}

interface BulkExportData {
  format: 'csv' | 'json';
  filters?: any;
  include_ai_results?: boolean;
}

export const adminEvaluationsAPI = {
  /**
   * Get all evaluations with filters
   */
  getEvaluations: async (filters: EvaluationFilters = {}) => {
    const params = new URLSearchParams();
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());
    if (filters.status) params.append('status', filters.status);
    if (filters.supervisor_id) params.append('supervisor_id', filters.supervisor_id);
    if (filters.company_id) params.append('company_id', filters.company_id);
    if (filters.date_range) params.append('date_range', JSON.stringify(filters.date_range));
    if (filters.search) params.append('search', filters.search);

    const queryString = params.toString();
    const endpoint = `/admin/evaluations${queryString ? `?${queryString}` : ''}`;
    return fetchAPI(endpoint);
  },

  /**
   * Get single evaluation with details
   */
  getEvaluation: async (id: string) => {
    return fetchAPI(`/admin/evaluations/${id}`);
  },

  /**
   * Get AI results for evaluation
   */
  getAIResults: async (id: string) => {
    return fetchAPI(`/admin/evaluations/${id}/ai-results`);
  },

  /**
   * Validate sentiment analysis
   */
  validateSentiment: async (id: string, data: ValidateSentimentData) => {
    return fetchAPI(`/admin/evaluations/${id}/validate-sentiment`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  /**
   * Validate feature extraction
   */
  validateFeatures: async (id: string, data: ValidateFeaturesData) => {
    return fetchAPI(`/admin/evaluations/${id}/validate-features`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  /**
   * Validate bias check
   */
  validateBias: async (id: string, data: ValidateBiasData) => {
    return fetchAPI(`/admin/evaluations/${id}/validate-bias`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  /**
   * Approve evaluation
   */
  approveEvaluation: async (id: string, data: ApproveEvaluationData) => {
    return fetchAPI(`/admin/evaluations/${id}/approve`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Override grade
   */
  overrideGrade: async (id: string, data: OverrideGradeData) => {
    return fetchAPI(`/admin/evaluations/${id}/override-grade`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Reject evaluation
   */
  rejectEvaluation: async (id: string, data: RejectEvaluationData) => {
    return fetchAPI(`/admin/evaluations/${id}/reject`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Request AI reprocess
   */
  requestReprocess: async (id: string, data: RequestReprocessData = {}) => {
    return fetchAPI(`/admin/evaluations/${id}/request-reprocess`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Get quality metrics
   */
  getQualityMetrics: async () => {
    return fetchAPI('/admin/evaluations/metrics/quality');
  },

  /**
   * Get metrics by supervisor
   */
  getMetricsBySupervisor: async () => {
    return fetchAPI('/admin/evaluations/metrics/by-supervisor');
  },

  /**
   * Get metrics by company
   */
  getMetricsByCompany: async () => {
    return fetchAPI('/admin/evaluations/metrics/by-company');
  },

  /**
   * Bulk approve evaluations
   */
  bulkApprove: async (data: BulkApproveData) => {
    return fetchAPI('/admin/evaluations/bulk-approve', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Bulk export evaluations
   */
  bulkExport: async (data: BulkExportData) => {
    const token = await getAuthToken();
    
    const response = await fetch(`${API_BASE_URL}/admin/evaluations/bulk-export`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        error: 'Export failed',
        message: response.statusText,
      }));
      throw new Error(error.error || error.message || 'Failed to export evaluations');
    }

    // If CSV, trigger download
    if (data.format === 'csv') {
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `evaluations-export-${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      return { success: true, message: 'Export downloaded' };
    }

    return response.json();
  },
};
