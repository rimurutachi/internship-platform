/**
 * Enhanced Internship Management Types
 * Type definitions for v2.0 enhanced features
 */

export type ReminderType =
  | 'approaching_end_date'
  | 'pending_documents'
  | 'pending_weekly_report'
  | 'evaluation_due'
  | 'missing_supervisor'
  | 'custom';

export type NotificationChannel = 'in_app' | 'email' | 'both';

export type DocumentStatus = 'submitted' | 'pending' | 'missing' | 'overdue' | 'draft';

export interface InternshipReminder {
  id: string;
  internship_id: string;
  reminder_type: ReminderType;
  scheduled_for: string;
  sent_at: string | null;
  is_sent: boolean;
  notification_channel: NotificationChannel;
  custom_message?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateReminderRequest {
  reminder_type: ReminderType;
  scheduled_for: string;
  notification_channel?: NotificationChannel;
  custom_message?: string;
}

export interface UpdateReminderRequest {
  scheduled_for?: string;
  notification_channel?: NotificationChannel;
  custom_message?: string;
}

export interface SendReminderRequest {
  reminder_type: ReminderType;
  notification_channel?: NotificationChannel;
  custom_message?: string;
}

export interface DocumentStatusInfo {
  type: string;
  status: DocumentStatus;
  required: boolean;
  submitted_by: string | null;
  submitted_at: string | null;
  expected_by?: string;
}

export interface DocumentSubmissionStatus {
  required_documents: DocumentStatusInfo[];
  weekly_reports: DocumentStatusInfo[];
  submitted_documents: any[];
}

export interface CompanyCapacityInfo {
  id: string;
  name: string;
  is_verified: boolean;
  is_moa_standardized: boolean;
  capacity_limit: number;
  current_students: number;
  capacity_usage_percent: number;
  is_at_capacity: boolean;
  is_near_capacity: boolean;
  upcoming_expirations?: number;
}

export interface UpdateCompanyCapacityRequest {
  capacity_limit?: number;
  is_moa_standardized?: boolean;
}

export interface BulkReminderRequest {
  internship_ids: string[];
  reminder_type: ReminderType;
  notification_channel?: NotificationChannel;
  custom_message?: string;
}

export interface BulkStatusUpdateRequest {
  internship_ids: string[];
  new_status: string;
}

export interface BulkOperationResponse {
  sent_count?: number;
  updated_count?: number;
  failed_count: number;
  errors?: string[];
}

export interface ExportInternshipsRequest {
  ids: string[];
  format: 'csv' | 'json' | 'excel';
}

export interface GenerateReportRequest {
  internship_ids: string[];
  report_type: 'placement' | 'performance' | 'documents';
  format: 'pdf' | 'excel';
}

export interface GenerateReportResponse {
  report_url: string;
  message: string;
  metadata?: any;
}

export interface CapacityAnalytics {
  total_companies: number;
  at_capacity: number;
  near_capacity: number;
  with_availability: number;
  metrics: CompanyCapacityInfo[];
}

export interface DocumentSubmissionRateAnalytics {
  overall_rate: number;
  by_company: Record<string, { total: number; count: number; avg: number }>;
  by_document_type?: Record<string, number>;
  total_internships: number;
}

// Filter types for enhanced filtering
export interface EnhancedInternshipFilters {
  status?: string;
  university_id?: string;
  company_id?: string;
  search?: string;
  company_affiliation?: 'affiliated' | 'non_affiliated';
  document_status?: 'complete' | 'missing' | 'overdue';
  approaching_deadline?: '14_days' | '30_days';
  capacity_status?: 'at_capacity' | 'below_80';
  reminder_status?: 'pending' | 'sent';
  page?: number;
  limit?: number;
}

// Company validation result
export interface CompanyCapacityValidation {
  canAccept: boolean;
  message?: string;
}

// Enhanced internship with capacity info
export interface InternshipWithCapacity {
  id: string;
  student_id: string;
  company_id: string;
  company_name: string;
  position_title: string;
  start_date: string;
  end_date: string;
  status: string;
  advisor_id: string;
  supervisor_id: string;
  company_capacity?: CompanyCapacityInfo;
  pending_reminders?: number;
  document_completion_rate?: number;
}
