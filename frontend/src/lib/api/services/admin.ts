/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Admin API Service
 * 
 * Handles admin user management API calls
 */

import { apiClient, get, post, patch, del } from '../client';

/**
 * User data interface
 */
export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: 'student' | 'advisor' | 'supervisor' | 'admin';
  status: 'active' | 'inactive' | 'suspended' | 'archived';
  verified: boolean;
  verification_status?: 'pending_verification' | 'verified' | 'rejected';
  verification_rejection_reason?: string;
  is_archived?: boolean;
  archived_at?: string;
  created_at: string;
  updated_at: string;
  last_login?: string;
  company_id?: string; // For supervisors
  university_id?: string; // For students/advisors
  year_level?: string; // For students/advisors
  profile_data?: {
    program?: string;
    course?: string;
    department?: string;
    section?: string;
    assigned_advisor_id?: string;
    assigned_advisor_name?: string;
    [key: string]: any;
  };
}

/**
 * User filters for getAllUsers
 */
export interface UserFilters {
  role?: 'student' | 'advisor' | 'supervisor' | 'admin';
  status?: 'active' | 'inactive' | 'suspended';
  search?: string;
  page?: number;
  limit?: number;
  program?: string;
  year_level?: string;
  section?: string;
}

/**
 * Pagination response
 */
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * Create user request data
 */
export interface CreateUserRequest {
  email: string;
  firstName: string;
  lastName: string;
  role: 'student' | 'advisor' | 'supervisor' | 'admin';
  password: string;
  company_id?: string; // For supervisors - link to their company
  university_id?: string; // For students/advisors
  program?: string; // For students/advisors - e.g., 'BSIT', 'BSCS'
  year_level?: string; // For students/advisors - e.g., '1st Year', '4th Year'
  section?: string; // For students/advisors - e.g., '4A', '4B'
}

/**
 * Update user request data
 */
export interface UpdateUserRequest {
  firstName?: string;
  lastName?: string;
  email?: string;
  company_id?: string; // For updating supervisor's company
  university_id?: string; // For updating student/advisor university
}

/**
 * User statistics
 */
export interface UserStats {
  total: number;
  active: number;
  students: number;
  advisors: number;
  supervisors: number;
  admins: number;
}

/**
 * Get all users with filtering, search, and pagination
 */
export const getUsers = async (filters?: UserFilters): Promise<PaginatedResponse<AdminUser>> => {
  try {
    const params = new URLSearchParams();
    
    if (filters?.role) params.append('role', filters.role);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.search) params.append('search', filters.search);
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());
    if (filters?.program) params.append('program', filters.program);
    if (filters?.year_level) params.append('year_level', filters.year_level);
    if (filters?.section) params.append('section', filters.section);

    const queryString = params.toString();
    const endpoint = `/admin/users${queryString ? `?${queryString}` : ''}`;
    
    // Use apiClient directly to get the full response structure
    const response = await apiClient.get(endpoint);
    return {
      data: response.data.data || [],
      pagination: response.data.pagination || { page: 1, limit: 10, total: 0, totalPages: 0 }
    };
  } catch (error: any) {
    console.error('Failed to fetch users:', error);
    throw error;
  }
};

/**
 * Get single user by ID
 */
export const getUser = async (id: string): Promise<AdminUser> => {
  try {
    const response = await get<AdminUser>(`/admin/users/${id}`);
    return response;
  } catch (error: any) {
    console.error(`Failed to fetch user ${id}:`, error);
    throw error;
  }
};

/**
 * Create new user
 */
export const createUser = async (userData: CreateUserRequest): Promise<AdminUser> => {
  try {
    const response = await post<AdminUser>('/admin/users', userData);
    return response;
  } catch (error: any) {
    console.error('Failed to create user:', error);
    throw error;
  }
};

/**
 * Update user information (name, email)
 */
export const updateUser = async (id: string, updates: UpdateUserRequest): Promise<AdminUser> => {
  try {
    const response = await patch<AdminUser>(`/admin/users/${id}`, updates);
    return response;
  } catch (error: any) {
    console.error(`Failed to update user ${id}:`, error);
    throw error;
  }
};

/**
 * Update user status
 */
export const updateUserStatus = async (
  id: string,
  status: 'active' | 'inactive' | 'suspended'
): Promise<AdminUser> => {
  try {
    const response = await patch<AdminUser>(`/admin/users/${id}/status`, { status });
    return response;
  } catch (error: any) {
    console.error(`Failed to update user status for ${id}:`, error);
    throw error;
  }
};

/**
 * Update user role
 */
export const updateUserRole = async (
  id: string,
  role: 'student' | 'advisor' | 'supervisor' | 'admin'
): Promise<AdminUser> => {
  try {
    const response = await patch<AdminUser>(`/admin/users/${id}/role`, { role });
    return response;
  } catch (error: any) {
    console.error(`Failed to update user role for ${id}:`, error);
    throw error;
  }
};

/**
 * Delete user
 */
export const deleteUser = async (id: string): Promise<void> => {
  try {
    await del(`/admin/users/${id}`);
  } catch (error: any) {
    console.error(`Failed to delete user ${id}:`, error);
    throw error;
  }
};

/**
 * Get user statistics
 */
export const getUserStats = async (): Promise<UserStats> => {
  try {
    // Use apiClient directly to get the data field
    const response = await apiClient.get('/admin/users/stats/overview');
    return response.data.data;
  } catch (error: any) {
    console.error('Failed to fetch user statistics:', error);
    throw error;
  }
};

/**
 * Verify user profile (NEW - replaces edit functionality)
 */
export const verifyUser = async (id: string, comments?: string): Promise<AdminUser> => {
  try {
    const response = await post<AdminUser>(`/admin/users/${id}/verify`, { comments });
    return response;
  } catch (error: any) {
    console.error(`Failed to verify user ${id}:`, error);
    throw error;
  }
};

/**
 * Reject user profile with reason (NEW)
 */
export const rejectUser = async (id: string, rejection_reason: string): Promise<AdminUser> => {
  try {
    const response = await post<AdminUser>(`/admin/users/${id}/reject`, { rejection_reason });
    return response;
  } catch (error: any) {
    console.error(`Failed to reject user ${id}:`, error);
    throw error;
  }
};

/**
 * Archive user (soft delete) (NEW - replaces hard delete)
 */
export const archiveUser = async (id: string): Promise<void> => {
  try {
    await post(`/admin/users/${id}/archive`, {});
  } catch (error: any) {
    console.error(`Failed to archive user ${id}:`, error);
    throw error;
  }
};

/**
 * Unarchive user (restore from archive) (NEW)
 */
export const unarchiveUser = async (id: string): Promise<AdminUser> => {
  try {
    const response = await post<AdminUser>(`/admin/users/${id}/unarchive`, {});
    return response;
  } catch (error: any) {
    console.error(`Failed to unarchive user ${id}:`, error);
    throw error;
  }
};

// Export all functions as named exports for convenience
export const adminAPI = {
  getUsers,
  getUser,
  createUser,
  updateUser,
  updateUserStatus,
  updateUserRole,
  deleteUser,
  getUserStats,
  verifyUser,
  rejectUser,
  archiveUser,
  unarchiveUser,
};
