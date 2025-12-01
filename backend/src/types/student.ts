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

export interface StudentDocument {
  id: string;
  internship_id: string;
  title: string;
  type: string;
  status: 'pending' | 'approved' | 'rejected';
  file_url?: string;
  version: string;
  uploaded_by: string;
  created_at: string;
  updated_at: string;
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
}

export interface StudentMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  message_type: 'text' | 'file' | 'system';
  file_url?: string;
  is_edited: boolean;
  created_at: string;
  sender?: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
}

export interface StudentNotification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
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

export interface DashboardData {
  internship: StudentInternship;
  progress: ProgressMetrics;
  recent_evaluations: StudentEvaluation[];
  upcoming_tasks: any[];
  ai_insights?: AIInsights;
  notifications_count: number;
}
