/**
 * Supervisor Evaluations API
 * 
 * API client for supervisor evaluation operations including real-time AI analysis
 */

import { get, post, put } from './client';

/**
 * Draft analysis result from AI service (lightweight, real-time)
 */
export interface DraftAnalysisResult {
  status: string;
  features: {
    technical_skills: string[];
    soft_skills: string[];
  };
  sentiment: {
    score: number;
    label: string;
    breakdown: Record<string, number>;
  };
  processing_time_ms?: number;
}

/**
 * Complete AI analysis result with bias check
 */
export interface AIAnalysisResult {
  features: {
    technical_skills: string[];
    soft_skills: string[];
  };
  sentiment: {
    score: number;
    label: string;
    breakdown: Record<string, number>;
  };
  bias_check: {
    passed: boolean;
    flags: string[];
    severity?: string;
    consistency_score?: number;
  };
  confidence_score: number;
  processing_time_ms: number;
  recommended_grade?: number;
}

/**
 * Evaluation form data for submission
 */
export interface EvaluationFormData {
  internship_id: string;
  supervisor_id: string;
  feedback_text: string;
  rating_overall?: number | null;
  rating_technical?: number | null;
  rating_communication?: number | null;
  rating_work_ethic?: number | null;
}

/**
 * Evaluation entity from backend
 */
export interface SupervisorEvaluation {
  id: string;
  internship_id: string;
  supervisor_id: string;
  feedback_text: string;
  rating_overall: number | null;
  rating_technical: number | null;
  rating_communication: number | null;
  rating_work_ethic: number | null;
  status: 'draft' | 'submitted' | 'processed' | 'approved';
  submitted_at: string | null;
  processed_at: string | null;
  created_at: string;
  updated_at: string;
  ai_analysis_id?: string | null;
  bias_check_passed?: boolean | null;
  confidence_score?: number | null;
  internship?: {
    id: string;
    position: string;
    student: {
      id: string;
      first_name: string;
      last_name: string;
      email: string;
    };
    company: {
      id: string;
      name: string;
    };
  };
}

/**
 * AI analysis record from database
 */
export interface EvaluationAIAnalysis {
  id: string;
  evaluation_id: string;
  extracted_technical_skills: string[];
  extracted_soft_skills: string[];
  key_achievements: string[];
  areas_for_improvement: string[];
  sentiment_positive_score: number;
  sentiment_neutral_score: number;
  sentiment_negative_score: number;
  overall_sentiment: string;
  ai_recommendations: string[];
  suggested_improvements: string[];
  potential_biases: string[];
  ai_model_version: string;
  processing_time_ms: number;
  overall_confidence_score: number;
  created_at: string;
}

/**
 * Submission response with AI analysis
 */
export interface SubmitEvaluationResponse {
  evaluation: SupervisorEvaluation;
  ai_analysis: EvaluationAIAnalysis | null;
  warning?: string;
}

/**
 * Get all evaluations for a specific internship
 */
export async function getInternshipEvaluations(internshipId: string): Promise<SupervisorEvaluation[]> {
  return get<SupervisorEvaluation[]>(`/evaluations/internship/${internshipId}`);
}

/**
 * Get a single evaluation by ID
 */
export async function getEvaluationById(evaluationId: string): Promise<SupervisorEvaluation> {
  return get<SupervisorEvaluation>(`/evaluations/${evaluationId}`);
}

/**
 * Analyze draft evaluation text (real-time, lightweight)
 * 
 * @param text - Evaluation feedback text to analyze
 * @returns Draft analysis with features and sentiment (no bias check)
 */
export async function analyzeDraftEvaluation(text: string): Promise<DraftAnalysisResult> {
  if (!text || text.trim().length < 5) {
    throw new Error('Text is too short for analysis (minimum 5 characters)');
  }

  return post<DraftAnalysisResult>('/evaluations/analyze-draft', { text });
}

/**
 * Create a new evaluation (draft)
 */
export async function createEvaluation(data: EvaluationFormData): Promise<SupervisorEvaluation> {
  return post<SupervisorEvaluation>('/evaluations', data);
}

/**
 * Update an existing evaluation (draft only)
 */
export async function updateEvaluation(
  evaluationId: string,
  data: Partial<EvaluationFormData>
): Promise<SupervisorEvaluation> {
  return put<SupervisorEvaluation>(`/evaluations/${evaluationId}`, data);
}

/**
 * Submit evaluation for AI processing
 * 
 * This triggers full AI analysis including bias detection and saves results to database
 * 
 * @param evaluationId - ID of the evaluation to submit
 * @returns Evaluation with complete AI analysis
 */
export async function submitEvaluation(evaluationId: string): Promise<SubmitEvaluationResponse> {
  return post<SubmitEvaluationResponse>(`/evaluations/${evaluationId}/submit`, {});
}

/**
 * Get supervisor's evaluations (all or filtered)
 */
export async function getSupervisorEvaluations(
  supervisorId?: string,
  status?: 'draft' | 'submitted' | 'processed' | 'approved'
): Promise<SupervisorEvaluation[]> {
  const params: Record<string, string> = {};
  if (supervisorId) params.supervisor_id = supervisorId;
  if (status) params.status = status;

  return get<SupervisorEvaluation[]>('/evaluations', params);
}
