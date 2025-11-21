/**
 * Admin API Service
 * 
 * Handles admin user management API calls
 */

import { apiClient, get, post, patch, del, ApiResponse } from '../client';

/**
 * User data interface
 */
export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: 'student' | 'advisor' | 'supervisor' | 'admin';
  status: 'active' | 'inactive' | 'suspended';
  verified: boolean;
  created_at: string;
  updated_at: string;
  last_login?: string;
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
  name: string;
  role: 'student' | 'advisor' | 'supervisor' | 'admin';
  password: string;
}

/**
 * Update user request data
 */
export interface UpdateUserRequest {
  name?: string;
  email?: string;
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
};
