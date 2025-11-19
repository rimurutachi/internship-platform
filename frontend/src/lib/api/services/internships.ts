/**
 * Internship API Service
 * 
 * Handles all internship-related API calls
 */

import { get, post, put, patch } from '../client';
import type { Internship, PaginatedResponse, ListParams } from '@/types/api';

/**
 * Create internship data
 */
export interface CreateInternshipData {
  student_id: string;
  advisor_id: string;
  supervisor_id: string;
  company_id: string;
  position_title: string;
  description?: string;
  start_date: string;
  end_date: string;
  learning_objectives?: string[];
}

/**
 * Update internship data
 */
export interface UpdateInternshipData {
  position_title?: string;
  description?: string;
  start_date?: string;
  end_date?: string;
  status?: 'pending' | 'active' | 'completed' | 'cancelled';
  learning_objectives?: string[];
  skills_gained?: string[];
}

/**
 * Internship service
 */
export const internshipService = {
  /**
   * Get all internships with pagination and filtering
   */
  list: async (params?: ListParams): Promise<PaginatedResponse<Internship>> => {
    return get<PaginatedResponse<Internship>>('/internships', params);
  },

  /**
   * Get a specific internship by ID
   */
  getById: async (id: string): Promise<Internship> => {
    return get<Internship>(`/internships/${id}`);
  },

  /**
   * Get current user's active internship
   */
  getCurrent: async (): Promise<Internship | null> => {
    return get<Internship | null>('/internships/current');
  },

  /**
   * Get internships by student ID
   */
  getByStudent: async (studentId: string, params?: ListParams): Promise<PaginatedResponse<Internship>> => {
    return get<PaginatedResponse<Internship>>(`/internships/student/${studentId}`, params);
  },

  /**
   * Get internships by advisor ID
   */
  getByAdvisor: async (advisorId: string, params?: ListParams): Promise<PaginatedResponse<Internship>> => {
    return get<PaginatedResponse<Internship>>(`/internships/advisor/${advisorId}`, params);
  },

  /**
   * Get internships by supervisor ID
   */
  getBySupervisor: async (supervisorId: string, params?: ListParams): Promise<PaginatedResponse<Internship>> => {
    return get<PaginatedResponse<Internship>>(`/internships/supervisor/${supervisorId}`, params);
  },

  /**
   * Create a new internship
   */
  create: async (data: CreateInternshipData): Promise<Internship> => {
    return post<Internship>('/internships', data);
  },

  /**
   * Update an internship
   */
  update: async (id: string, data: UpdateInternshipData): Promise<Internship> => {
    return put<Internship>(`/internships/${id}`, data);
  },

  /**
   * Update internship status
   */
  updateStatus: async (id: string, status: Internship['status']): Promise<Internship> => {
    return patch<Internship>(`/internships/${id}/status`, { status });
  },

  /**
   * Get internship statistics
   */
  getStats: async (): Promise<{
    total: number;
    active: number;
    completed: number;
    pending: number;
  }> => {
    return get('/internships/stats');
  },
};
