/**
 * API Client Configuration
 * 
 * Centralized HTTP client with authentication and error handling
 */

import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import { createSupabaseClient } from '@/lib/supabase';

/**
 * API Response wrapper
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

/**
 * API Error class
 */
export class ApiError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Creates an axios instance configured for the backend API
 */
const createApiClient = (): AxiosInstance => {
  const baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
  
  const client = axios.create({
    baseURL, // baseURL already includes /api from env
    timeout: 30000,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  /**
   * Request interceptor - Attach JWT token to all requests
   */
  client.interceptors.request.use(
    async (config: InternalAxiosRequestConfig) => {
      try {
        const supabase = createSupabaseClient();
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.access_token) {
          config.headers.Authorization = `Bearer ${session.access_token}`;
          console.log('API Request:', config.method?.toUpperCase(), config.url, '- Token attached');
        } else {
          console.warn('API Request:', config.method?.toUpperCase(), config.url, '- No token available');
        }
      } catch (error) {
        console.error('Error attaching auth token:', error);
      }
      
      return config;
    },
    (error) => Promise.reject(error)
  );

  /**
   * Response interceptor - Handle errors consistently
   */
  client.interceptors.response.use(
    (response) => response,
    async (error: AxiosError<ApiResponse>) => {
      if (error.response) {
        const { status, data } = error.response;
        
        // Handle authentication errors
        if (status === 401) {
          // Token expired or invalid - redirect to login
          if (typeof window !== 'undefined') {
            const supabase = createSupabaseClient();
            await supabase.auth.signOut();
            window.location.href = '/login';
          }
        }
        
        throw new ApiError(
          status,
          data?.error || data?.message || 'An error occurred',
          data
        );
      } else if (error.request) {
        // Network error
        throw new ApiError(
          0,
          'Network error. Please check your connection.',
          error
        );
      } else {
        // Other errors
        throw new ApiError(
          500,
          error.message || 'An unexpected error occurred',
          error
        );
      }
    }
  );

  return client;
};

/**
 * Singleton API client instance
 */
export const apiClient = createApiClient();

/**
 * Helper function for GET requests
 */
export async function get<T>(url: string, params?: Record<string, unknown>): Promise<T> {
  const response = await apiClient.get<ApiResponse<T>>(url, { params });
  return response.data.data as T;
}

/**
 * Helper function for POST requests
 */
export async function post<T>(url: string, data?: unknown): Promise<T> {
  const response = await apiClient.post<ApiResponse<T>>(url, data);
  return response.data.data as T;
}

/**
 * Helper function for PUT requests
 */
export async function put<T>(url: string, data?: unknown): Promise<T> {
  const response = await apiClient.put<ApiResponse<T>>(url, data);
  return response.data.data as T;
}

/**
 * Helper function for PATCH requests
 */
export async function patch<T>(url: string, data?: unknown): Promise<T> {
  const response = await apiClient.patch<ApiResponse<T>>(url, data);
  return response.data.data as T;
}

/**
 * Helper function for DELETE requests
 */
export async function del<T>(url: string): Promise<T> {
  const response = await apiClient.delete<ApiResponse<T>>(url);
  return response.data.data as T;
}
