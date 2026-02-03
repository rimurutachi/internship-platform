/**
 * Supervisor Students API
 * 
 * API client for supervisor student management operations
 */

import { get } from './client';

export interface SupervisorCompany {
  id: string;
  name: string;
  industry?: string;
}

export interface SupervisorInternship {
  id: string;
  title?: string;
  position?: string;
  department?: string;
  start_date?: string;
  end_date?: string;
  status?: string;
  progress?: number;
  company: SupervisorCompany;
  latest_evaluation?: SupervisorLatestEvaluation | null;
}

export interface SupervisorLatestEvaluation {
  id: string;
  created_at: string;
  status?: string;
  total_score?: number;
  final_grade?: number;
  attendance?: string;
  punctuality?: string;
  supervisor_comments?: string;
  criterion_scores?: Array<{
    criterion_code: string;
    criterion_name: string;
    score: number;
  }>;
  // Legacy fields for backward compatibility
  rating_overall?: number;
  rating_technical?: number;
  rating_communication?: number;
  rating_work_ethic?: number;
}

export interface SupervisorStudent {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  university?: string;
  program?: string;
  internship: SupervisorInternship | null;
  latest_evaluation?: SupervisorLatestEvaluation | null;
}

export interface SupervisorEvaluationDetail extends SupervisorLatestEvaluation {
  internship_id: string;
  strengths?: string;
  areas_for_improvement?: string;
}

export interface SupervisorStudentDetails extends SupervisorStudent {
  internships: SupervisorInternship[];
  evaluations: SupervisorEvaluationDetail[];
}

// Note: The shared api client already wraps responses in ApiResponse
// and returns the inner `data` payload. Therefore, use plain types
// for get()/post() generics, not wrapped response shapes.

export const getMyStudents = async (): Promise<SupervisorStudent[]> => {
  const students = await get<SupervisorStudent[]>('/supervisor/students');
  return students || [];
};

export const getStudentDetails = async (studentId: string): Promise<SupervisorStudentDetails> => {
  const details = await get<SupervisorStudentDetails>(`/supervisor/students/${studentId}`);
  return details;
};

export const getLatestEvaluations = async (): Promise<SupervisorLatestEvaluation[]> => {
  const response = await get<{ success: boolean; data: SupervisorLatestEvaluation[]; }>(`/supervisor/evaluations`);
  return response.data;
};

export default {
  getMyStudents,
  getStudentDetails,
  getLatestEvaluations,
};
