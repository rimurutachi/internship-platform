/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Student API Client
 * Handles all API calls for student dashboard and features
 */

import { createSupabaseClient } from '@/lib/supabase';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// Helper function to get auth headers
const getAuthHeaders = async () => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  
  // Get token from Supabase session
  const supabase = createSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.access_token) {
    headers.Authorization = `Bearer ${session.access_token}`;
  }
  
  return headers;
};

// Generic API call wrapper
async function apiCall<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<{ success: boolean; data?: T; error?: string }> {
  try {
    const authHeaders = await getAuthHeaders();
    const url = `${API_BASE_URL}${endpoint}`;
    
    console.log(`🔵 API Call: ${options.method || 'GET'} ${url}`);
    console.log('🔑 Auth Headers:', authHeaders);
    
    const response = await fetch(url, {
      ...options,
      headers: {
        ...authHeaders,
        ...options.headers,
      },
    });

    console.log(`📡 Response Status: ${response.status} ${response.statusText}`);
    console.log(`📄 Content-Type: ${response.headers.get('content-type')}`);

    // Check if response is JSON
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const text = await response.text();
      console.error('❌ Non-JSON response:', text.substring(0, 200));
      return {
        success: false,
        error: `Server returned HTML instead of JSON. Status: ${response.status}`,
      };
    }

    const data = await response.json();
    console.log('📦 Response Data:', data);

    if (!response.ok) {
      return {
        success: false,
        error: data.error || `HTTP ${response.status}: ${response.statusText}`,
      };
    }

    return data;
  } catch (error: any) {
    console.error(`💥 API call failed for ${endpoint}:`, error);
    return {
      success: false,
      error: error.message || 'Network error',
    };
  }
}

export const studentAPI = {
  // ============ Profile APIs ============
  
  /**
   * Get student profile
   */
  getProfile: async () => {
    return apiCall<{ user: any }>('/student/profile');
  },

  /**
   * Update student profile
   */
  updateProfile: async (data: {
    first_name?: string;
    last_name?: string;
    profile_data?: any;
  }) => {
    return apiCall<{ user: any; message: string }>('/student/profile', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  /**
   * Get student settings
   */
  getSettings: async () => {
    return apiCall<{ settings: any }>('/student/profile/settings');
  },

  /**
   * Update student settings
   */
  updateSettings: async (data: {
    notification_preferences?: any;
    privacy_settings?: any;
  }) => {
    return apiCall<{ message: string }>('/student/profile/settings', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  // ============ Internship APIs ============

  /**
   * Get current internship
   */
  getCurrentInternship: async () => {
    return apiCall<{ internship: any }>('/student/internship');
  },

  /**
   * Get internship timeline/milestones
   */
  getTimeline: async () => {
    return apiCall<{ milestones: any[] }>('/student/internship/timeline');
  },

  /**
   * Get progress metrics
   */
  getProgress: async () => {
    return apiCall<{
      overall_progress: number;
      completion_by_phase: any;
      time_remaining_days: number;
      weeks_remaining: number;
    }>('/student/internship/progress');
  },

  // ============ Evaluation APIs ============

  /**
   * Get all evaluations
   */
  getEvaluations: async (limit: number = 10, offset: number = 0) => {
    return apiCall<{
      evaluations: any[];
      summary: any;
    }>(`/student/evaluations?limit=${limit}&offset=${offset}`);
  },

  /**
   * Get single evaluation
   */
  getEvaluation: async (id: string) => {
    return apiCall<{ evaluation: any }>(`/student/evaluations/${id}`);
  },

  /**
   * Get skills assessment
   */
  getSkillsAssessment: async () => {
    return apiCall<{
      skills: Array<{ name: string; rating: number; trend: string }>;
      ai_confidence_score: number;
      last_updated: string | null;
    }>('/student/skills-assessment');
  },

  // ============ Document APIs ============

  /**
   * Get all documents
   */
  getDocuments: async (type?: string, status?: string) => {
    const params = new URLSearchParams();
    if (type) params.append('type', type);
    if (status) params.append('status', status);
    const query = params.toString();
    return apiCall<{ documents: any[] }>(
      `/student/documents${query ? `?${query}` : ''}`
    );
  },

  /**
   * Upload new document
   */
  uploadDocument: async (data: {
    title: string;
    type: string;
    file_url?: string;
    document_template_id?: string;
  }) => {
    return apiCall<{ document: any; message: string }>('/student/documents', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Get single document
   */
  getDocument: async (id: string) => {
    return apiCall<{ document: any }>(`/student/documents/${id}`);
  },

  /**
   * Update document
   */
  updateDocument: async (id: string, data: { title?: string; status?: string }) => {
    return apiCall<{ document: any; message: string }>(`/student/documents/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  /**
   * Delete (archive) document
   */
  deleteDocument: async (id: string) => {
    return apiCall<{ message: string }>(`/student/documents/${id}`, {
      method: 'DELETE',
    });
  },

  /**
   * Get required documents status
   */
  getRequiredDocuments: async () => {
    return apiCall<{ required_documents: any[] }>('/student/documents/required');
  },

  // ============ Message APIs ============

  /**
   * Get all conversations
   */
  getConversations: async (type?: string, limit: number = 20, offset: number = 0) => {
    const params = new URLSearchParams({ limit: limit.toString(), offset: offset.toString() });
    if (type) params.append('type', type);
    return apiCall<{ conversations: any[] }>(
      `/student/messages/conversations?${params.toString()}`
    );
  },

  /**
   * Get messages in conversation
   */
  getConversationMessages: async (conversationId: string, limit: number = 20, offset: number = 0) => {
    return apiCall<{
      conversation: any;
      messages: any[];
      pagination: any;
    }>(
      `/student/messages/conversations/${conversationId}?limit=${limit}&offset=${offset}`
    );
  },

  /**
   * Send message to conversation
   */
  sendMessage: async (conversationId: string, content: string, file_url?: string) => {
    return apiCall<{ message: any; created_at: string }>(
      `/student/messages/conversations/${conversationId}/messages`,
      {
        method: 'POST',
        body: JSON.stringify({ content, file_url }),
      }
    );
  },

  /**
   * Create new conversation
   */
  createConversation: async (participant_ids: string[], type: string = 'direct') => {
    return apiCall<{ conversation: any }>('/student/messages/conversations', {
      method: 'POST',
      body: JSON.stringify({ participant_ids, type }),
    });
  },

  /**
   * Mark conversation as read
   */
  markConversationRead: async (conversationId: string) => {
    return apiCall<{ message: string }>(
      `/student/messages/conversations/${conversationId}/mark-read`,
      {
        method: 'POST',
      }
    );
  },

  // ============ Notification APIs ============

  /**
   * Get reminders
   */
  getReminders: async () => {
    return apiCall<{ reminders: any[] }>('/student/reminders');
  },

  /**
   * Get notifications
   */
  getNotifications: async (limit: number = 20, offset: number = 0, is_read?: boolean) => {
    const params = new URLSearchParams({ limit: limit.toString(), offset: offset.toString() });
    if (is_read !== undefined) params.append('is_read', is_read.toString());
    return apiCall<{ notifications: any[] }>(
      `/student/notifications?${params.toString()}`
    );
  },

  /**
   * Mark notification as read
   */
  markNotificationRead: async (id: string) => {
    return apiCall<{ message: string }>(`/student/notifications/${id}/read`, {
      method: 'PATCH',
    });
  },

  /**
   * Mark all notifications as read
   */
  markAllNotificationsRead: async () => {
    return apiCall<{ message: string }>('/student/notifications/read-all', {
      method: 'PATCH',
    });
  },

  // ============ Mentor APIs ============

  /**
   * Get mentors (advisor and supervisor)
   */
  getMentors: async () => {
    return apiCall<{ advisor: any; supervisor: any }>('/student/mentors');
  },

  /**
   * Send quick message to mentor
   */
  messageMentor: async (mentorId: string, message: string) => {
    return apiCall<{ message: any; conversation_id: string }>(
      `/student/mentors/${mentorId}/message`,
      {
        method: 'POST',
        body: JSON.stringify({ message }),
      }
    );
  },

  // ============ Task APIs ============

  /**
   * Get tasks with optional filters
   */
  getTasks: async (filters?: {
    status?: 'pending' | 'in_progress' | 'completed' | 'all';
    priority?: 'low' | 'medium' | 'high';
    internship_id?: string;
  }) => {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.priority) params.append('priority', filters.priority);
    if (filters?.internship_id) params.append('internship_id', filters.internship_id);
    const query = params.toString() ? `?${params.toString()}` : '';
    return apiCall<{ tasks: any[]; stats: { total: number; pending: number; in_progress: number; completed: number } }>(`/student/tasks${query}`);
  },

  /**
   * Get task statistics for dashboard widget
   */
  getTaskStats: async (internshipId?: string) => {
    const query = internshipId ? `?internship_id=${internshipId}` : '';
    return apiCall<{ total: number; pending: number; in_progress: number; completed: number }>(`/student/tasks/stats${query}`);
  },

  /**
   * Get single task by ID
   */
  getTaskById: async (id: string) => {
    return apiCall<any>(`/student/tasks/${id}`);
  },

  /**
   * Create a new task
   */
  createTask: async (data: {
    internship_id: string;
    title: string;
    description?: string;
    priority?: 'low' | 'medium' | 'high';
    due_date?: string;
  }) => {
    return apiCall<any>('/student/tasks', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Update task
   */
  updateTask: async (id: string, data: {
    title?: string;
    description?: string;
    priority?: 'low' | 'medium' | 'high';
    status?: 'pending' | 'in_progress' | 'completed';
    due_date?: string | null;
  }) => {
    return apiCall<any>(`/student/tasks/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  /**
   * Delete task
   */
  deleteTask: async (id: string) => {
    return apiCall<{ message: string }>(`/student/tasks/${id}`, {
      method: 'DELETE',
    });
  },

  /**
   * Bulk update task statuses
   */
  bulkUpdateTaskStatus: async (taskIds: string[], status: 'pending' | 'in_progress' | 'completed') => {
    return apiCall<{ updated: number }>('/student/tasks/bulk-status', {
      method: 'POST',
      body: JSON.stringify({ task_ids: taskIds, status }),
    });
  },

  // ============ Dashboard API ============

  /**
   * Get complete dashboard data
   */
  getDashboard: async () => {
    return apiCall<{
      internship: any;
      progress: any;
      recent_evaluations: any[];
      upcoming_tasks: any[];
      ai_insights?: any;
      notifications_count: number;
    }>('/student/dashboard');
  },

  // ============ Daily Reports APIs ============

  /**
   * Get daily reports for an internship
   */
  getDailyReports: async (internshipId: string) => {
    return apiCall<{ data: any[] }>(`/student/daily-reports?internship_id=${internshipId}`);
  },

};

export default studentAPI;
