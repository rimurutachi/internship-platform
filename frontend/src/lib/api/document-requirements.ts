/**
 * Document Requirements API
 * 
 * API functions for advisor document requirements management
 */

import { apiClient, ApiResponse } from './client';

// ============================================================================
// Types
// ============================================================================

export interface DocumentRequirement {
  id: string;
  title: string;
  description: string | null;
  created_by: string;
  university_id: string | null;
  due_date: string | null;
  is_mandatory: boolean;
  target_audience: 'all_students' | 'specific_internship' | 'specific_student';
  metadata: {
    internship_ids?: string[];
    student_ids?: string[];
    file_requirements?: {
      max_size?: number;
      allowed_types?: string[];
    };
  };
  status: 'active' | 'archived';
  created_at: string;
  updated_at: string;
  creator?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  };
  submission_stats?: {
    total_submissions: number;
    pending: number;
    approved: number;
    rejected: number;
    revision_requested: number;
  };
  // Student-specific fields
  my_submission?: DocumentSubmission;
  submission_status?: string;
  is_overdue?: boolean;
}

export interface DocumentSubmission {
  id: string;
  requirement_id: string;
  student_id: string;
  file_url: string;
  file_name: string;
  file_size: number;
  mime_type: string;
  version: number;
  status: 'pending' | 'approved' | 'rejected' | 'revision_requested';
  reviewed_by: string | null;
  feedback: string | null;
  reviewed_at: string | null;
  submitted_at: string;
  created_at: string;
  updated_at: string;
  student?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  };
  requirement?: DocumentRequirement;
}

export interface CreateRequirementDTO {
  title: string;
  description?: string;
  due_date?: string;
  is_mandatory?: boolean;
  target_audience?: 'all_students' | 'specific_internship' | 'specific_student';
  metadata?: {
    internship_ids?: string[];
    student_ids?: string[];
    file_requirements?: {
      max_size?: number;
      allowed_types?: string[];
    };
  };
}

export interface UpdateRequirementDTO extends Partial<CreateRequirementDTO> {
  status?: 'active' | 'archived';
}

export interface ReviewSubmissionDTO {
  status: 'approved' | 'rejected' | 'revision_requested';
  feedback?: string;
  manual_hours_override?: number;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// ============================================================================
// Advisor API Functions
// ============================================================================

/**
 * Create a new document requirement
 */
export const createDocumentRequirement = async (
  data: CreateRequirementDTO
): Promise<ApiResponse<DocumentRequirement>> => {
  const response = await apiClient.post('/advisor/document-requirements', data);
  return response.data;
};

/**
 * Get all document requirements for the advisor
 */
export const getAdvisorDocumentRequirements = async (params?: {
  status?: 'active' | 'archived';
  page?: number;
  limit?: number;
}): Promise<PaginatedResponse<DocumentRequirement>> => {
  const response = await apiClient.get('/advisor/document-requirements', { params });
  return response.data;
};

/**
 * Get a single document requirement by ID
 */
export const getDocumentRequirement = async (
  id: string
): Promise<ApiResponse<DocumentRequirement>> => {
  const response = await apiClient.get(`/advisor/document-requirements/${id}`);
  return response.data;
};

/**
 * Update a document requirement
 */
export const updateDocumentRequirement = async (
  id: string,
  data: UpdateRequirementDTO
): Promise<ApiResponse<DocumentRequirement>> => {
  const response = await apiClient.patch(`/advisor/document-requirements/${id}`, data);
  return response.data;
};

/**
 * Delete (archive) a document requirement
 */
export const deleteDocumentRequirement = async (
  id: string
): Promise<ApiResponse<void>> => {
  const response = await apiClient.delete(`/advisor/document-requirements/${id}`);
  return response.data;
};

/**
 * Get all submissions for a requirement
 */
export const getRequirementSubmissions = async (
  requirementId: string,
  params?: {
    status?: string;
    page?: number;
    limit?: number;
  }
): Promise<PaginatedResponse<DocumentSubmission>> => {
  const response = await apiClient.get(
    `/advisor/document-requirements/${requirementId}/submissions`,
    { params }
  );
  return response.data;
};

/**
 * Get a single submission by ID
 */
export const getSubmission = async (
  id: string
): Promise<ApiResponse<DocumentSubmission>> => {
  const response = await apiClient.get(`/advisor/submissions/${id}`);
  return response.data;
};

/**
 * Review a submission (approve/reject/request revision)
 */
export const reviewSubmission = async (
  id: string,
  data: ReviewSubmissionDTO
): Promise<ApiResponse<DocumentSubmission>> => {
  const response = await apiClient.patch(`/advisor/submissions/${id}/review`, data);
  return response.data;
};

// ============================================================================
// Student API Functions
// ============================================================================

/**
 * Get all document requirements assigned to the student
 */
export const getStudentDocumentRequirements = async (params?: {
  status?: 'pending' | 'completed' | 'all';
  page?: number;
  limit?: number;
}): Promise<PaginatedResponse<DocumentRequirement>> => {
  const response = await apiClient.get('/student/document-requirements', { params });
  return response.data;
};

/**
 * Get a single document requirement for student
 */
export const getStudentDocumentRequirement = async (
  id: string
): Promise<ApiResponse<DocumentRequirement>> => {
  const response = await apiClient.get(`/student/document-requirements/${id}`);
  return response.data;
};

/**
 * Get submission history for a requirement
 */
export const getSubmissionHistory = async (
  requirementId: string
): Promise<ApiResponse<DocumentSubmission[]>> => {
  const response = await apiClient.get(`/student/document-requirements/${requirementId}/history`);
  return response.data;
};

/**
 * Get all submissions made by the student
 */
export const getStudentSubmissions = async (params?: {
  requirement_id?: string;
  status?: string;
  page?: number;
  limit?: number;
}): Promise<PaginatedResponse<DocumentSubmission>> => {
  const response = await apiClient.get('/student/document-submissions', { params });
  return response.data;
};

/**
 * Submit a document for a requirement
 */
export const submitDocument = async (
  requirementId: string,
  data: {
    file_url: string;
    file_name: string;
    file_size: number;
    mime_type: string;
  }
): Promise<ApiResponse<DocumentSubmission>> => {
  const response = await apiClient.post(
    `/student/document-requirements/${requirementId}/submit`,
    data
  );
  return response.data;
};

/**
 * Resubmit a document after revision request
 */
export const resubmitDocument = async (
  submissionId: string,
  data: {
    file_url: string;
    file_name: string;
    file_size: number;
    mime_type: string;
  }
): Promise<ApiResponse<DocumentSubmission>> => {
  const response = await apiClient.post(
    `/student/document-submissions/${submissionId}/resubmit`,
    data
  );
  return response.data;
};

// ============================================================================
// Signed URL Functions (for secure document downloads)
// ============================================================================

/**
 * Get a signed URL for an advisor to download a submission file
 */
export const getAdvisorSubmissionSignedUrl = async (
  submissionId: string
): Promise<ApiResponse<{ signedUrl: string; expiresAt: string }>> => {
  const response = await apiClient.get(`/advisor/submissions/${submissionId}/signed-url`);
  return response.data;
};

/**
 * Get a signed URL for a student to download their submission file
 */
export const getStudentSubmissionSignedUrl = async (
  submissionId: string
): Promise<ApiResponse<{ signedUrl: string; expiresAt: string }>> => {
  const response = await apiClient.get(`/student/document-submissions/${submissionId}/signed-url`);
  return response.data;
};

/**
 * Get a signed URL for an admin to download an MOA submission file
 */
export const getAdminMOASignedUrl = async (
  submissionId: string
): Promise<ApiResponse<{ signedUrl: string; expiresIn: number }>> => {
  const response = await apiClient.get(`/admin/moa/submissions/${submissionId}/signed-url`);
  return response.data;
};