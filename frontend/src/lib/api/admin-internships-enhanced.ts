/**
 * Enhanced Admin Internships API Client
 * API calls for v2.0 enhanced features
 */

import axios from 'axios';
import { createSupabaseClient } from '@/lib/supabase';
import {
  InternshipReminder,
  CreateReminderRequest,
  UpdateReminderRequest,
  SendReminderRequest,
  DocumentSubmissionStatus,
  CompanyCapacityInfo,
  UpdateCompanyCapacityRequest,
  BulkReminderRequest,
  BulkStatusUpdateRequest,
  BulkOperationResponse,
  ExportInternshipsRequest,
  GenerateReportRequest,
  GenerateReportResponse,
  CapacityAnalytics,
  DocumentSubmissionRateAnalytics
} from '@/types/internships-enhanced';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

/**
 * Get authentication token from Supabase session
 */
const getAuthToken = async (): Promise<string | null> => {
  if (typeof window === 'undefined') return null;
  
  try {
    const supabase = createSupabaseClient();
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token || null;
  } catch (error) {
    console.error('Error getting auth token:', error);
    return null;
  }
};

// Create axios instance with auth
const createAuthAxios = async () => {
  const token = await getAuthToken();
  return axios.create({
    baseURL: `${API_BASE_URL}/admin/internships/enhanced`,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` })
    }
  });
};

export const adminInternshipsEnhancedAPI = {
  // ============================================================
  // Reminder Management
  // ============================================================

  /**
   * Get all reminders for an internship
   */
  getReminders: async (internshipId: string): Promise<InternshipReminder[]> => {
    const api = await createAuthAxios();
    const response = await api.get(`/reminders/${internshipId}`);
    return response.data.reminders;
  },

  /**
   * Create a new reminder
   */
  createReminder: async (
    internshipId: string,
    data: CreateReminderRequest
  ): Promise<InternshipReminder> => {
    const api = await createAuthAxios();
    const response = await api.post('/reminders', { ...data, internship_id: internshipId });
    return response.data.reminder;
  },

  /**
   * Update an existing reminder
   */
  updateReminder: async (
    reminderId: string,
    data: UpdateReminderRequest
  ): Promise<InternshipReminder> => {
    const api = await createAuthAxios();
    const response = await api.patch(`/reminders/${reminderId}`, data);
    return response.data.reminder;
  },

  /**
   * Delete a reminder
   */
  deleteReminder: async (reminderId: string): Promise<void> => {
    const api = await createAuthAxios();
    await api.delete(`/reminders/${reminderId}`);
  },

  /**
   * Send immediate reminder
   */
  sendReminder: async (reminderId: string): Promise<{ message: string }> => {
    const api = await createAuthAxios();
    const response = await api.post(`/reminders/${reminderId}/send`);
    return response.data;
  },

  /**
   * Send immediate reminder with custom data
   */
  sendImmediateReminder: async (
    internshipId: string,
    data: SendReminderRequest
  ): Promise<{ message: string }> => {
    const api = await createAuthAxios();
    const response = await api.post('/reminders', { ...data, internship_id: internshipId, send_immediately: true });
    return response.data;
  },

  /**
   * Bulk send reminders
   */
  bulkSendReminders: async (data: BulkReminderRequest): Promise<BulkOperationResponse> => {
    const api = await createAuthAxios();
    const response = await api.post('/reminders/bulk-send', data);
    return response.data;
  },

  // ============================================================
  // Company Capacity Management
  // ============================================================

  /**
   * Get company capacity overview
   */
  getCapacityOverview: async (): Promise<CompanyCapacityInfo[]> => {
    const api = await createAuthAxios();
    const response = await api.get('/capacity/overview');
    return response.data;
  },

  /**
   * Validate company capacity
   */
  validateCapacity: async (companyId: string): Promise<{ is_valid: boolean; message: string }> => {
    const api = await createAuthAxios();
    const response = await api.post('/capacity/validate', { company_id: companyId });
    return response.data;
  },

  // ============================================================
  // Document Tracking
  // ============================================================

  /**
   * Get document submission status
   */
  getDocumentStatus: async (internshipId: string): Promise<DocumentSubmissionStatus> => {
    const api = await createAuthAxios();
    const response = await api.get(`/documents/${internshipId}`);
    return response.data;
  },

  /**
   * Get document completion rate
   */
  getDocumentCompletionRate: async (internshipIds: string[]): Promise<DocumentSubmissionRateAnalytics> => {
    const api = await createAuthAxios();
    const response = await api.get('/documents/completion-rate', {
      params: { internship_ids: internshipIds.join(',') }
    });
    return response.data;
  },

  // ============================================================
  // Bulk Operations
  // ============================================================

  /**
   * Bulk update status
   */
  bulkUpdateStatus: async (data: BulkStatusUpdateRequest): Promise<BulkOperationResponse> => {
    const api = await createAuthAxios();
    const response = await api.post('/bulk/update-status', data);
    return response.data;
  },

  /**
   * Bulk export internships
   */
  bulkExport: async (data: ExportInternshipsRequest): Promise<any> => {
    const api = await createAuthAxios();
    const response = await api.post('/bulk/export', data);
    return response.data;
  },

  /**
   * Generate report
   */
  generateReport: async (data: GenerateReportRequest): Promise<GenerateReportResponse> => {
    const api = await createAuthAxios();
    const response = await api.post('/analytics/generate-report', data);
    return response.data;
  },

  /**
   * Get deadline tracking
   */
  getDeadlineTracking: async (): Promise<any> => {
    const api = await createAuthAxios();
    const response = await api.get('/analytics/deadline-tracking');
    return response.data;
  }
};

export default adminInternshipsEnhancedAPI;
