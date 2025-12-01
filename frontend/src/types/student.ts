/**
 * Student-specific TypeScript types for frontend
 */

export interface StudentProfile {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  name: string;
  role: 'student';
  profile_data?: {
    major?: string;
    university?: string;
    student_id?: string;
    year_level?: string;
    contact_number?: string;
    address?: string;
    settings?: {
      notification_preferences?: {
        email: boolean;
        push: boolean;
        evaluation_updates: boolean;
        message_alerts: boolean;
        document_reminders: boolean;
      };
      privacy_settings?: {
        profile_visibility: 'public' | 'private';
        show_contact_info: boolean;
      };
    };
  };
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
}

export interface StudentInternship {
  id: string;
  student_id: string;
  company_id: string;
  advisor_id: string;
  supervisor_id: string;
  position: string;
  department: string;
  start_date: string;
  end_date: string;
  status: 'active' | 'completed' | 'cancelled';
  progress_percentage?: number;
  company?: {
    id: string;
    name: string;
    industry: string;
    location: string;
  };
  advisor?: {
    id: string;
    first_name: string;
    last_name: string;
    name: string;
    email: string;
  };
  supervisor?: {
    id: string;
    first_name: string;
    last_name: string;
    name: string;
    email: string;
  };
}

export interface StudentEvaluation {
  id: string;
  internship_id: string;
  supervisor_id: string;
  feedback_text: string;
  rating_overall?: number;
  rating_technical?: number;
  rating_communication?: number;
  rating_work_ethic?: number;
  sentiment_scores?: {
    positive: number;
    neutral: number;
    negative: number;
  };
  llt_features?: string[];
  status: 'draft' | 'submitted' | 'processed' | 'approved';
  submitted_at?: string;
  created_at: string;
  supervisor?: {
    id: string;
    first_name: string;
    last_name: string;
    name: string;
    email: string;
  };
}

export interface EvaluationSummary {
  average_rating: number;
  total_evaluations: number;
  latest_evaluation: string | null;
}

export interface StudentDocument {
  id: string;
  internship_id: string;
  title: string;
  type: string;
  status: 'pending' | 'submitted' | 'approved' | 'rejected' | 'archived';
  file_url?: string;
  version: string;
  uploaded_by: string;
  created_at: string;
  updated_at: string;
  notes?: string;
}

export interface RequiredDocument {
  type: string;
  status: string;
  submitted_date?: string | null;
  due_date?: string;
  week?: number;
}

export interface StudentConversation {
  id: string;
  type: 'direct' | 'group' | 'internship';
  participants: Array<{
    id: string;
    name: string;
    email: string;
    role: string;
  }>;
  last_message?: string;
  last_message_time?: string;
  unread_count?: number;
  created_at: string;
  updated_at?: string;
}

export interface StudentMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  message_type: 'text' | 'file' | 'system';
  file_url?: string;
  is_edited: boolean;
  read_at?: string;
  created_at: string;
  sender?: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
}

export interface MessagePagination {
  total: number;
  limit: number;
  offset: number;
}

export interface StudentNotification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
  action_url?: string;
  reference_id?: string;
}

export interface StudentTask {
  id: string;
  title: string;
  description?: string;
  due_date?: string;
  status: 'pending' | 'completed' | 'overdue';
  priority: 'low' | 'medium' | 'high';
  completed_date?: string;
  assigned_by?: string;
  created_at: string;
}

export interface StudentReminder {
  id: string;
  type: string;
  title: string;
  due_date: string;
  days_until_due: number;
  priority: 'low' | 'medium' | 'high';
}

export interface ProgressMetrics {
  overall_progress: number;
  completion_by_phase: {
    onboarding: number;
    development: number;
    evaluation: number;
  };
  time_remaining_days: number;
  weeks_remaining: number;
}

export interface InternshipMilestone {
  title: string;
  dueDate: string;
  status: 'pending' | 'completed';
  description: string;
}

export interface AIInsights {
  performance_trend?: 'up' | 'down' | 'stable';
  sentiment_analysis?: {
    positive: number;
    neutral: number;
    negative: number;
  };
  key_strengths?: string[];
  growth_areas?: string[];
  recommendations?: string[];
  confidence_score?: number;
  total_feedback_count?: number;
}

export interface SkillAssessment {
  skills: Array<{
    name: string;
    rating: number;
    trend: 'up' | 'down' | 'stable';
  }>;
  ai_confidence_score: number;
  last_updated: string | null;
}

export interface DashboardData {
  internship: StudentInternship;
  progress: ProgressMetrics;
  recent_evaluations: StudentEvaluation[];
  upcoming_tasks: any[];
  ai_insights?: AIInsights;
  notifications_count: number;
}

export interface StudentMentors {
  advisor: {
    id: string;
    first_name: string;
    last_name: string;
    name: string;
    email: string;
  } | null;
  supervisor: {
    id: string;
    first_name: string;
    last_name: string;
    name: string;
    email: string;
  } | null;
}

// API Response types
export interface StudentAPIResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface EvaluationsResponse {
  evaluations: StudentEvaluation[];
  summary: EvaluationSummary;
  count?: number;
}

export interface ConversationMessagesResponse {
  conversation: StudentConversation;
  messages: StudentMessage[];
  pagination: MessagePagination;
}
