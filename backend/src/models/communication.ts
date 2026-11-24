export interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  action_url?: string;
  reference_id?: string;
  reference_type?: string;
  metadata?: any;
  is_read: boolean;
  read_at?: Date;
  created_at: Date;
}

export interface ActivityLog {
  id: string;
  user_id: string;
  action: string;
  entity_type: string;
  entity_id?: string;
  description?: string;
  metadata?: any;
  internship_id?: string;
  created_at: Date;
}

export interface CreateNotificationDTO {
  user_id: string;
  type: string;
  title: string;
  message: string;
  action_url?: string;
  reference_id?: string;
  reference_type?: string;
  metadata?: Record<string, any>;
}

export type NotificationCategory =
  | 'all'
  | 'internship'
  | 'document'
  | 'evaluation'
  | 'message'
  | 'system';

export interface NotificationQueryOptions {
  limit?: number;
  page?: number;
  offset?: number;
  is_read?: boolean;
  category?: NotificationCategory;
  type?: string;
  search?: string;
}

export interface PaginatedNotificationsResult {
  notifications: Notification[];
  total: number;
  unread_count: number;
  page: number;
  limit: number;
  has_more: boolean;
}
