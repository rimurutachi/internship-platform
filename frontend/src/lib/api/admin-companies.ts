/**
 * Admin Companies API Client
 * Handles all API calls for admin company management
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export interface Company {
  id: string;
  name: string;
  industry?: string;
  address?: string;
  contact_info?: {
    email?: string;
    phone?: string;
    website?: string;
  };
  code?: string;
  capacity_limit?: number;
  current_students?: number;
  is_verified?: boolean;
  is_moa_standardized?: boolean;
  created_at: string;
}

export interface CompanyWithSupervisors extends Company {
  supervisors?: Array<{
    id: string;
    name: string;
    email: string;
  }>;
  supervisor_count?: number;
  active_internships?: number;
}

export interface CompanyCreateInput {
  name: string;
  industry?: string;
  address?: string;
  contact_info?: {
    email?: string;
    phone?: string;
    website?: string;
  };
  code?: string;
  capacity_limit?: number;
  is_verified?: boolean;
  is_moa_standardized?: boolean;
}

export interface CompanyUpdateInput {
  name?: string;
  industry?: string;
  address?: string;
  contact_info?: {
    email?: string;
    phone?: string;
    website?: string;
  };
  code?: string;
  capacity_limit?: number;
  is_verified?: boolean;
  is_moa_standardized?: boolean;
}

export interface CompanyFilters {
  page?: number;
  limit?: number;
  search?: string;
  industry?: string;
  is_verified?: boolean;
}

export interface CompanyStats {
  total: number;
  verified: number;
  with_moa: number;
  active_partnerships: number;
  total_supervisors: number;
  total_capacity: number;
  current_students: number;
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
    throw new Error(error.message || error.error || 'Request failed');
  }

  return response.json();
}

export const adminCompaniesAPI = {
  /**
   * Get all companies with pagination and filters
   */
  getCompanies: async (
    filters?: CompanyFilters
  ): Promise<{
    success: boolean;
    data: {
      companies: CompanyWithSupervisors[];
      pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
      };
    };
  }> => {
    const params = new URLSearchParams();
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());
    if (filters?.search) params.append('search', filters.search);
    if (filters?.industry) params.append('industry', filters.industry);
    if (filters?.is_verified !== undefined)
      params.append('is_verified', filters.is_verified.toString());

    return fetchAPI(`/admin/companies?${params.toString()}`);
  },

  /**
   * Get single company by ID
   */
  getCompany: async (
    companyId: string
  ): Promise<{
    success: boolean;
    data: CompanyWithSupervisors;
  }> => {
    return fetchAPI(`/admin/companies/${companyId}`);
  },

  /**
   * Create new company
   */
  createCompany: async (
    data: CompanyCreateInput
  ): Promise<{
    success: boolean;
    data: Company;
    message: string;
  }> => {
    return fetchAPI('/admin/companies', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Update company
   */
  updateCompany: async (
    companyId: string,
    data: CompanyUpdateInput
  ): Promise<{
    success: boolean;
    data: Company;
    message: string;
  }> => {
    return fetchAPI(`/admin/companies/${companyId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  /**
   * Delete company
   */
  deleteCompany: async (
    companyId: string
  ): Promise<{
    success: boolean;
    message: string;
  }> => {
    return fetchAPI(`/admin/companies/${companyId}`, {
      method: 'DELETE',
    });
  },

  /**
   * Get company statistics
   */
  getStats: async (): Promise<{
    success: boolean;
    data: CompanyStats;
  }> => {
    return fetchAPI('/admin/companies/stats');
  },

  /**
   * Get supervisors for a company
   */
  getSupervisors: async (
    companyId: string
  ): Promise<{
    success: boolean;
    data: {
      supervisors: Array<{
        id: string;
        name: string;
        email: string;
        last_login?: string;
        active_internships?: number;
      }>;
    };
  }> => {
    return fetchAPI(`/admin/companies/${companyId}/supervisors`);
  },
};
