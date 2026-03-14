/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * API Type Definitions
 * 
 * Types aligned with backend models and API responses
 */

/**
 * Internship entity from backend
 */
export interface Internship {
  id: string;
  student_id: string;
  advisor_id: string;
  supervisor_id: string;
  company_id: string;
  position: string;
  position_title?: string; // Legacy field
  description?: string;
  start_date: string;
  end_date: string;
  status: 'pending' | 'active' | 'completed' | 'cancelled';
  learning_objectives?: string[];
  skills_gained?: string[];
  created_at?: string;
  updated_at?: string;
}

/**
 * Internship with related entities (for admin management)
 */
export interface InternshipWithRelations extends Internship {
  student: {
    id: string;
    name: string;
    email: string;
    university_id?: string;
  };
  advisor: {
    id: string;
    name: string;
    email: string;
    university_id?: string;
  };
  supervisor: {
    id: string;
    name: string;
    email: string;
    company_id?: string;
  };
  company: {
    id: string;
    name: string;
    industry?: string;
  };
}

/**
 * Internship creation input
 */
export interface InternshipCreateInput {
  student_id: string;
  company_id: string;
  position: string;
  advisor_id: string;
  supervisor_id: string;
  start_date: string;
  end_date: string;
  status?: 'pending' | 'active' | 'completed' | 'cancelled';
}

/**
 * Internship update input
 */
export interface InternshipUpdateInput {
  position?: string;
  advisor_id?: string;
  supervisor_id?: string;
  start_date?: string;
  end_date?: string;
  status?: 'pending' | 'active' | 'completed' | 'cancelled';
}

/**
 * Internship filters
 */
export interface InternshipFilters {
  page?: number;
  limit?: number;
  status?: string;
  university_id?: string;
  company_id?: string;
  search?: string;
}

/**
 * Activity log entry
 */
export interface ActivityLogEntry {
  id: string;
  user_id: string;
  action: string;
  entity_type: string;
  entity_id: string;
  internship_id?: string;
  created_at: string;
  description: string;
  metadata?: Record<string, any>;
  user?: {
    name: string;
    email: string;
  };
}

/**
 * Evaluation entity from backend
 */
export type EvaluationType = 'weekly' | 'midterm' | 'final';

export interface Evaluation {
  id: string;
  internship_id: string;
  supervisor_id: string;
  feedback_text: string;
  rating_overall: number | null;
  rating_technical: number | null;
  rating_communication: number | null;
  rating_work_ethic: number | null;
  sentiment_scores: Record<string, number> | null;
  lit_features: string[] | null;
  recommended_grade: number | null;
  confidence_score: number | null;
  bias_check_passed: boolean | null;
  final_grade: number | null;
  status: 'draft' | 'submitted' | 'processed' | 'approved';
  evaluation_type: EvaluationType;
  week_number?: number | null;
  evaluation_period?: string | null;
  due_date?: string | null;
  is_mandatory?: boolean | null;
  submitted_at: string | null;
  processed_at: string | null;
  created_at: string;
  updated_at: string;
  // Rubric-based fields
  rubric_id?: string | null;
  criterion_scores?: Array<{
    criterion_code: string;
    criterion_name: string;
    score: number;
  }> | null;
  total_score?: number | null;
  attendance?: number | null;
  punctuality?: number | null;
  supervisor_comments?: string | null;
}

/**
 * Evaluation with related entities
 */
export interface EvaluationWithRelations extends Evaluation {
  internship: {
    id: string;
    position: string;
    student: {
      id: string;
      name: string;
      email: string;
    };
    supervisor: {
      id: string;
      name: string;
      email: string;
    };
    advisor: {
      id: string;
      name: string;
      email: string;
    };
    company: {
      id: string;
      name: string;
    };
  };
  avg_rating?: number;
}

/**
 * AI Results from evaluation
 */
export interface AIResults {
  sentiment_analysis: Record<string, number>;
  features: string[];
  recommended_grade: number;
  confidence_score: number;
  bias_check_passed: boolean;
}

/**
 * Evaluation filters
 */
export interface EvaluationFilters {
  page?: number;
  limit?: number;
  status?: string;
  evaluation_type?: EvaluationType;
  supervisor_id?: string;
  company_id?: string;
  date_range?: { start: string; end: string };
  search?: string;
}

/**
 * Quality metrics for evaluations
 */
export interface QualityMetrics {
  total: number;
  on_draft: number;
  submitted: number;
  approved: number;
}

/**
 * Supervisor evaluation metrics
 */
export interface SupervisorMetrics {
  id: string;
  name: string;
  email: string;
  eval_count: number;
  avg_ratings: number;
  avg_confidence: number;
}

/**
 * Company evaluation metrics
 */
export interface CompanyMetrics {
  id: string;
  name: string;
  eval_count: number;
  avg_ratings: number;
  avg_confidence: number;
}



/**
 * Notification entity
 */
export interface Notification {
  id: string;
  user_id: string;
  type: 'message' | 'evaluation' | 'internship' | 'system';
  title: string;
  message: string;
  reference_id?: string;
  reference_type?: string;
  is_read: boolean;
  priority: 'low' | 'medium' | 'high';
  created_at?: string;
}

/**
 * Document entity
 */
export interface Document {
  id: string;
  title: string;
  content?: string;
  document_type: 'report' | 'agreement' | 'evaluation' | 'general';
  owner_id: string;
  internship_id?: string;
  status: 'draft' | 'review' | 'approved' | 'archived';
  version: number;
  is_collaborative: boolean;
  created_at?: string;
  updated_at?: string;
}

/**
 * Collaboration session for documents
 */
export interface CollaborationSession {
  id: string;
  document_id: string;
  user_id: string;
  cursor_position?: number;
  color: string;
  is_active: boolean;
  last_seen: string;
  user?: {
    id: string;
    first_name?: string;
    last_name?: string;
    email: string;
  };
}

/**
 * Pagination metadata
 */
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
}

/**
 * Paginated response
 */
export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

/**
 * Query parameters for list requests
 */
export interface ListParams extends Record<string, unknown> {
  page?: number;
  limit?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
  search?: string;
  filters?: Record<string, unknown>;
}

/**
 * Enhanced AI Analysis Types for Supervisor Evaluations
 */

/**
 * Bias flag detected by AI
 */
export interface BiasFlag {
  type: string;
  description: string;
  severity: 'low' | 'medium' | 'high';
  location?: string;
}

/**
 * Complete AI analysis result with Phase 1 enhancements
 */
export interface AIAnalysisResultComplete {
  features: {
    technical_skills: string[];
    soft_skills: string[];
  };
  sentiment: {
    score: number;
    label: 'positive' | 'neutral' | 'negative';
    tone?: 'praise' | 'constructive' | 'harsh' | 'balanced' | 'neutral';
    intensity?: 'mild' | 'moderate' | 'strong';
    subjectivity?: number;
    context_flags?: {
      has_praise: boolean;
      has_concerns: boolean;
      has_constructive: boolean;
      is_balanced: boolean;
      mentions_improvement: boolean;
      mentions_excellence: boolean;
    };
    insights?: Array<{
      type: string;
      message: string;
      suggestion?: string;
    }>;
    breakdown: {
      positive?: number;
      neutral?: number;
      negative?: number;
    };
  };
  bias_check: {
    passed: boolean;
    flags: Array<{
      type: string;
      severity: string;
      message: string;
    }>;
    severity?: 'low' | 'medium' | 'high' | 'none';
    consistency_score?: number;
  };
  llt_guidance?: {
    suggested_rating: number;
    range: {
      min: number;
      max: number;
    };
    confidence: number;
    breakdown: {
      sentiment_contribution: number;
      skill_contribution: number;
      text_quality_contribution: number;
      consistency_contribution: number;
    };
    explanation: string;
    guidance: Array<{
      type: string;
      message: string;
      priority: 'low' | 'medium' | 'high';
    }>;
  };
  feedback_quality?: {
    suggestions: Array<{
      type: string;
      severity: 'low' | 'medium' | 'high';
      message: string;
      current?: number;
      target?: number;
      examples?: string[];
      tip?: string;
      prompt?: string;
    }>;
    strengths: string[];
    quality_score: number;
    readiness: boolean;
    metrics: {
      word_count: number;
      sentence_count: number;
      skill_count: number;
      sentiment_balance: string;
      has_specific_examples: boolean;
    };
  };
  confidence_score: number;
  processing_time_ms: number;
  recommended_grade?: number;
}

/**
 * Draft analysis result (lightweight, real-time) - Phase 1 Enhanced
 */
export interface DraftAnalysisResultType {
  status: string;
  features: {
    technical_skills: string[];
    soft_skills: string[];
  };
  sentiment: {
    score: number;
    label: 'positive' | 'neutral' | 'negative';
    tone?: 'praise' | 'constructive' | 'harsh' | 'balanced' | 'neutral';
    intensity?: 'mild' | 'moderate' | 'strong';
    breakdown: Record<string, number>;
  };
  feedback_quality?: {
    suggestions: Array<{
      type: string;
      severity: 'low' | 'medium' | 'high';
      message: string;
      examples?: string[];
    }>;
    quality_score: number;
    readiness: boolean;
    metrics?: {
      word_count: number;
      skill_count: number;
    };
  };
  llt_guidance?: {
    suggested_rating: number;
    range: { min: number; max: number };
    confidence: number;
  };
  processing_time_ms?: number;
}

/**
 * Evaluation form data for supervisor
 */
export interface EvaluationFormDataType {
  internship_id: string;
  supervisor_id: string;
  feedback_text: string;
  rating_overall?: number | null;
  rating_technical?: number | null;
  rating_communication?: number | null;
  rating_work_ethic?: number | null;
}

/**
 * Evaluation AI analysis stored in database
 */
export interface EvaluationAIAnalysisRecord {
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
