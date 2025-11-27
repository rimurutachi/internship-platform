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
  submitted_at: string | null;
  processed_at: string | null;
  created_at: string;
  updated_at: string;
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
  supervisor_id?: string;
  company_id?: string;
  date_range?: { start: string; end: string };
  search?: string;
}

/**
 * Quality metrics for evaluations
 */
export interface QualityMetrics {
  total_this_month: number;
  total_processed: number;
  avg_confidence: number;
  bias_pass_rate: number;
  sentiment_distribution: {
    positive: number;
    neutral: number;
    negative: number;
  };
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
 * Conversation entity from backend
 */
export interface Conversation {
  id: string;
  title?: string;
  type: 'direct' | 'group';
  created_by: string;
  created_at?: string;
  updated_at?: string;
  last_message?: Message;
  unread_count?: number;
  participants?: ConversationParticipant[];
}

/**
 * Conversation participant
 */
export interface ConversationParticipant {
  user_id: string;
  conversation_id: string;
  role: 'admin' | 'member';
  joined_at?: string;
  last_read_at?: string;
  user?: {
    id: string;
    first_name?: string;
    last_name?: string;
    email: string;
    role: string;
    avatar_url?: string;
  };
}

/**
 * Message entity from backend
 */
export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  message_type: 'text' | 'file' | 'system';
  attachments?: Array<{
    file_name: string;
    file_type: string;
    file_url: string;
    file_size: number;
  }>;
  is_read: boolean;
  parent_message_id?: string;
  created_at?: string;
  updated_at?: string;
  sender?: {
    id: string;
    first_name?: string;
    last_name?: string;
    email: string;
    avatar_url?: string;
  };
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
