/**
 * Admin Internships API Client
 * Handles all API calls for admin internship management
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export interface Internship {
  id: string;
  student_id: string;
  company_id: string;
  advisor_id: string;
  supervisor_id: string;
  position: string;
  department?: string;
  start_date: string;
  end_date: string;
  status: 'pending' | 'active' | 'completed' | 'cancelled';
  created_at: string;
  updated_at: string;
}

export interface InternshipWithRelations extends Internship {
  student?: {
    id: string;
    name: string;
    email: string;
    university_id?: string;
  };
  advisor?: {
    id: string;
    name: string;
    email: string;
    university_id?: string;
  };
  supervisor?: {
    id: string;
    name: string;
    email: string;
    company_id?: string;
  };
  company?: {
    id: string;
    name: string;
    industry?: string;
  };
}

export interface InternshipCreateInput {
  student_id: string;
  company_id: string;
  position: string;
  department?: string;
  advisor_id: string;
  supervisor_id: string;
  start_date: string;
  end_date: string;
  status?: string;
}

export interface InternshipUpdateInput {
  position?: string;
  department?: string;
  advisor_id?: string;
  supervisor_id?: string;
  start_date?: string;
  end_date?: string;
  status?: string;
}

export interface InternshipFilters {
  page?: number;
  limit?: number;
  status?: string;
  university_id?: string;
  company_id?: string;
  search?: string;
}

export interface ActivityLogEntry {
  id: string;
  user_id: string;
  action: string;
  entity_type: string;
  entity_id: string;
  created_at: string;
  description: string;
  metadata?: Record<string, any>;
  user: {
    name: string;
    email: string;
  };
}

export interface InternshipStats {
  total: number;
  active: number;
  pending: number;
  completed: number;
  cancelled: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  university_id?: string;
  company_id?: string;
}

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

export const adminInternshipsAPI = {
  /**
   * Get all internships with filters and pagination
   */
  getInternships: async (
    filters: InternshipFilters = {}
  ): Promise<{
    success: boolean;
    data: {
      internships: InternshipWithRelations[];
      pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
      };
      total: number;
    };
  }> => {
    const queryParams = new URLSearchParams();

    if (filters.page) queryParams.append('page', filters.page.toString());
    if (filters.limit) queryParams.append('limit', filters.limit.toString());
    if (filters.status) queryParams.append('status', filters.status);
    if (filters.university_id)
      queryParams.append('university_id', filters.university_id);
    if (filters.company_id)
      queryParams.append('company_id', filters.company_id);
    if (filters.search) queryParams.append('search', filters.search);

    const queryString = queryParams.toString();
    const endpoint = `/admin/internships${queryString ? `?${queryString}` : ''}`;

    return fetchAPI(endpoint);
  },

  /**
   * Get single internship with activity log
   */
  getInternship: async (
    id: string
  ): Promise<{
    success: boolean;
    data: {
      internship: InternshipWithRelations;
      activity_log: ActivityLogEntry[];
    };
  }> => {
    return fetchAPI(`/admin/internships/${id}`);
  },

  /**
   * Create new internship
   */
  createInternship: async (
    data: InternshipCreateInput
  ): Promise<{
    success: boolean;
    data: {
      internship: Internship;
      message: string;
    };
  }> => {
    return fetchAPI('/admin/internships', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Update internship
   */
  updateInternship: async (
    id: string,
    data: InternshipUpdateInput
  ): Promise<{
    success: boolean;
    data: {
      internship: Internship;
      message: string;
    };
  }> => {
    return fetchAPI(`/admin/internships/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  /**
   * Delete/cancel internship
   */
  deleteInternship: async (
    id: string
  ): Promise<{
    success: boolean;
    data: {
      message: string;
    };
  }> => {
    return fetchAPI(`/admin/internships/${id}`, {
      method: 'DELETE',
    });
  },

  /**
   * Get available students (without active internships)
   */
  getAvailableStudents: async (): Promise<{
    success: boolean;
    data: {
      students: User[];
    };
  }> => {
    return fetchAPI('/admin/internships/available-students');
  },

  /**
   * Get advisors by university
   */
  getAdvisorsByUniversity: async (
    universityId: string
  ): Promise<{
    success: boolean;
    data: {
      advisors: User[];
    };
  }> => {
    return fetchAPI(`/admin/internships/advisors-by-university/${universityId}`);
  },

  /**
   * Get supervisors by company
   */
  getSupervisorsByCompany: async (
    companyId: string
  ): Promise<{
    success: boolean;
    data: {
      supervisors: User[];
    };
  }> => {
    return fetchAPI(`/admin/internships/supervisors-by-company/${companyId}`);
  },

  /**
   * Get activity log for internship
   */
  getActivityLog: async (
    internshipId: string
  ): Promise<{
    success: boolean;
    data: {
      activity_log: ActivityLogEntry[];
    };
  }> => {
    return fetchAPI(`/admin/internships/${internshipId}/activity-log`);
  },

  /**
   * Get internships summary statistics
   */
  getStats: async (): Promise<{
    success: boolean;
    data: InternshipStats;
  }> => {
    return fetchAPI('/admin/internships/stats/summary');
  },
};
