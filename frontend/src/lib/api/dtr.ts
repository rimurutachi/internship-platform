/**
 * Weekly DTR (Daily Time Record) API
 * 
 * API functions for weekly DTR submission and validation
 * Used by both student and advisor dashboards
 */

import { apiClient, ApiResponse } from './client';

// ============================================================================
// Types
// ============================================================================

export interface DTRSubmission {
  id: string;
  internship_id: string;
  student_id: string;
  requirement_id: string | null;
  week_number: number;
  week_start_date: string;
  week_end_date: string;
  file_url: string;
  file_name: string;
  file_size: number | null;
  mime_type: string | null;
  status: 'pending' | 'approved' | 'revision_requested';
  reviewed_by: string | null;
  reviewed_at: string | null;
  feedback: string | null;
  extracted_hours: number;
  ai_scan_status: 'pending' | 'scanning' | 'completed' | 'failed' | 'manual';
  ai_scan_result: {
    total_hours?: number;
    daily_breakdown?: Array<{
      date: string;
      day?: string;
      time_in: string;
      time_out: string;
      lunch_break_hours?: number;
      hours: number;
    }>;
    confidence_score?: number;
    notes?: string;
    error?: string;
  };
  manual_hours_override: number | null;
  version: number;
  submitted_at: string;
  created_at: string;
  updated_at: string;
  // Joined data
  student?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  };
  internship?: {
    id: string;
    position: string;
    company_id: string;
    advisor_id?: string;
    companies?: { name: string };
  };
}

export interface SubmitDTRData {
  internship_id: string;
  requirement_id?: string;
  week_number: number;
  week_start_date: string;
  week_end_date: string;
  file_url: string;
  file_name: string;
  file_size?: number;
  mime_type?: string;
}

export interface ReviewDTRData {
  status: 'approved' | 'revision_requested';
  feedback?: string;
  manual_hours_override?: number;
}

export interface PaginatedDTRResponse {
  success: boolean;
  data: DTRSubmission[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// ============================================================================
// Student API Functions
// ============================================================================

/**
 * Submit a weekly DTR
 */
export const submitDTR = async (
  data: SubmitDTRData
): Promise<ApiResponse<DTRSubmission>> => {
  const response = await apiClient.post('/student/dtr', data);
  return response.data;
};

/**
 * Get student's DTR submissions
 */
export const getMyDTRs = async (params?: {
  internship_id?: string;
  status?: string;
  page?: number;
  limit?: number;
}): Promise<PaginatedDTRResponse> => {
  const response = await apiClient.get('/student/dtr', { params });
  return response.data;
};

/**
 * Get a single DTR submission (student)
 */
export const getMyDTRById = async (
  id: string
): Promise<ApiResponse<DTRSubmission>> => {
  const response = await apiClient.get(`/student/dtr/${id}`);
  return response.data;
};

/**
 * Resubmit a DTR after revision request (edit in place)
 */
export const resubmitDTR = async (
  id: string,
  data: {
    file_url: string;
    file_name: string;
    file_size?: number;
    mime_type?: string;
  }
): Promise<ApiResponse<DTRSubmission>> => {
  const response = await apiClient.patch(`/student/dtr/${id}/resubmit`, data);
  return response.data;
};

/**
 * Get signed URL for student DTR file
 */
export const getStudentDTRSignedUrl = async (
  id: string
): Promise<ApiResponse<{ signedUrl: string; expiresIn: number }>> => {
  const response = await apiClient.get(`/student/dtr/${id}/signed-url`);
  return response.data;
};

// ============================================================================
// Advisor API Functions
// ============================================================================

/**
 * Get all DTR submissions for advisor's students
 */
export const getAdvisorDTRSubmissions = async (params?: {
  status?: string;
  page?: number;
  limit?: number;
}): Promise<PaginatedDTRResponse> => {
  const response = await apiClient.get('/advisor/dtr-submissions', { params });
  return response.data;
};

/**
 * Get a single DTR submission (advisor)
 */
export const getAdvisorDTRById = async (
  id: string
): Promise<ApiResponse<DTRSubmission>> => {
  const response = await apiClient.get(`/advisor/dtr-submissions/${id}`);
  return response.data;
};

/**
 * Review a DTR submission (approve or request revision)
 */
export const reviewDTR = async (
  id: string,
  data: ReviewDTRData
): Promise<ApiResponse<DTRSubmission>> => {
  const response = await apiClient.patch(`/advisor/dtr-submissions/${id}/review`, data);
  return response.data;
};

/**
 * Get signed URL for advisor DTR file
 */
export const getAdvisorDTRSignedUrl = async (
  id: string
): Promise<ApiResponse<{ signedUrl: string; expiresIn: number }>> => {
  const response = await apiClient.get(`/advisor/dtr-submissions/${id}/signed-url`);
  return response.data;
};
