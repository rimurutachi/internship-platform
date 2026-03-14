/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Admin Rubrics API Client
 * Handles rubric CRUD operations for admin dashboard
 */

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

export interface RubricCriterion {
  code: string; // A, B, C, D, E, F, G
  name: string;
  description: string;
  scale_descriptions: {
    '1-2': string;
    '3-4': string;
    '5-6': string;
    '7-8': string;
    '9-10': string;
  };
  max_score: number;
}

export interface GradingScale {
  min_score: number;
  max_score: number;
  grade: number;
}

export interface EvaluationRubric {
  id: string;
  rubric_name: string;
  description?: string;
  university_id: string;
  academic_year: string;
  version: number;
  is_active: boolean;
  criteria: RubricCriterion[];
  grading_scale: GradingScale[];
  created_at: string;
  created_by: string;
  updated_at?: string;
  deactivated_at?: string;
  deactivation_reason?: string;
}

export const adminRubricsAPI = {
  /**
   * Get all rubrics for admin's university
   */
  getAllRubrics: async (universityId: string, includeInactive = false) => {
    const params = new URLSearchParams();
    params.append('university_id', universityId);
    if (includeInactive) params.append('include_inactive', 'true');
    
    return fetchAPI<{ success: boolean; data: EvaluationRubric[] }>(
      `/admin/rubrics?${params.toString()}`
    );
  },

  /**
   * Get active rubric for university
   */
  getActiveRubric: async (universityId: string) => {
    const params = new URLSearchParams();
    params.append('university_id', universityId);
    
    return fetchAPI<{ success: boolean; data: EvaluationRubric; isDefault?: boolean }>(
      `/admin/rubrics/active?${params.toString()}`
    );
  },

  /**
   * Get rubric by ID
   */
  getRubric: async (rubricId: string) => {
    return fetchAPI<{ success: boolean; data: EvaluationRubric }>(
      `/admin/rubrics/${rubricId}`
    );
  },

  /**
   * Get rubric version history
   */
  getRubricHistory: async (rubricId: string) => {
    return fetchAPI<{ success: boolean; data: any[] }>(
      `/admin/rubrics/${rubricId}/history`
    );
  },

  /**
   * Create new rubric
   */
  createRubric: async (data: {
    university_id: string;
    academic_year: string;
    rubric_name: string;
    description?: string;
    criteria: RubricCriterion[];
    grading_scale: GradingScale[];
  }) => {
    return fetchAPI<{ success: boolean; data: EvaluationRubric; message: string }>(
      '/admin/rubrics',
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    );
  },

  /**
   * Update rubric (creates new version)
   */
  updateRubric: async (
    rubricId: string,
    updates: Partial<{
      rubric_name: string;
      description: string;
      criteria: RubricCriterion[];
      grading_scale: GradingScale[];
    }>,
    changeReason: string
  ) => {
    return fetchAPI<{ success: boolean; data: EvaluationRubric; message: string }>(
      `/admin/rubrics/${rubricId}`,
      {
        method: 'PUT',
        body: JSON.stringify({ updates, change_reason: changeReason }),
      }
    );
  },

  /**
   * Activate rubric
   */
  activateRubric: async (rubricId: string) => {
    return fetchAPI<{ success: boolean; data: EvaluationRubric; message: string }>(
      `/admin/rubrics/${rubricId}/activate`,
      {
        method: 'POST',
        body: JSON.stringify({}),
      }
    );
  },

  /**
   * Deactivate rubric
   */
  deactivateRubric: async (rubricId: string, reason?: string) => {
    return fetchAPI<{ success: boolean; data: EvaluationRubric; message: string }>(
      `/admin/rubrics/${rubricId}/deactivate`,
      {
        method: 'POST',
        body: JSON.stringify({ reason }),
      }
    );
  },
};