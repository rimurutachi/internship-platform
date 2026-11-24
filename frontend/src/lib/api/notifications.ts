/* eslint-disable @typescript-eslint/no-explicit-any */
import { createSupabaseClient } from '../supabase';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

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
  read_at?: string;
  created_at: string;
  updated_at?: string;
}

export type NotificationCategory =
  | 'all'
  | 'internship'
  | 'document'
  | 'evaluation'
  | 'message'
  | 'system';

export interface NotificationQueryParams {
  page?: number;
  limit?: number;
  is_read?: boolean;
  category?: NotificationCategory;
  search?: string;
}

export interface PaginatedNotificationsData {
  notifications: Notification[];
  total: number;
  unread_count: number;
  page: number;
  limit: number;
  has_more: boolean;
}

export interface CreateNotificationDTO {
  user_id: string;
  type: string;
  title: string;
  message: string;
  action_url?: string;
  reference_type?: string;
}

export interface UnreadCountResponse {
  success: boolean;
  data: {
    unread_count: number;
  };
}

export interface NotificationsResponse {
  success: boolean;
  data: Notification[];
  pagination?: {
    total: number;
    unread_count: number;
    page: number;
    limit: number;
    has_more: boolean;
  };
}

async function getAuthHeaders(): Promise<HeadersInit> {
  const supabase = createSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session?.access_token) {
    throw new Error('Not authenticated');
  }

  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${session.access_token}`
  };
}

// Simple in-memory cache to prevent API spam on rapid navigation or component remounts
let notificationsCache: {
  data: Notification[];
  timestamp: number;
} | null = null;
const CACHE_TTL_MS = 15000; // 15 seconds cache

export const notificationsAPI = {
  /**
   * Invalidate cached notifications (called on real-time socket events or mutations)
   */
  invalidateCache: () => {
    notificationsCache = null;
  },

  /**
   * Get user notifications
   * @param limit - Number of notifications to fetch (default: 50, max: 100)
   * @param forceRefresh - Bypass cache and force a network request
   */
  getNotifications: async (limit: number = 50, forceRefresh: boolean = false): Promise<Notification[]> => {
    if (!forceRefresh && notificationsCache && Date.now() - notificationsCache.timestamp < CACHE_TTL_MS) {
      return notificationsCache.data;
    }

    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/communications/notifications?limit=${limit}`, {
      method: 'GET',
      headers
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch notifications');
    }

    const result: NotificationsResponse = await response.json();

    notificationsCache = {
      data: result.data,
      timestamp: Date.now()
    };

    return result.data;
  },

  /**
   * Get paginated & filtered user notifications for the View All Notifications page
   */
  getNotificationsPaginated: async (
    params: NotificationQueryParams = {}
  ): Promise<PaginatedNotificationsData> => {
    const headers = await getAuthHeaders();
    const searchParams = new URLSearchParams();
    searchParams.set('paginated', 'true');
    searchParams.set('page', String(params.page ?? 1));
    searchParams.set('limit', String(params.limit ?? 20));

    if (params.is_read !== undefined) {
      searchParams.set('is_read', String(params.is_read));
    }
    if (params.category && params.category !== 'all') {
      searchParams.set('category', params.category);
    }
    if (params.search && params.search.trim()) {
      searchParams.set('search', params.search.trim());
    }

    const response = await fetch(
      `${API_BASE_URL}/communications/notifications?${searchParams.toString()}`,
      {
        method: 'GET',
        headers,
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch notifications');
    }

    const result: NotificationsResponse = await response.json();
    const pagination = result.pagination || {
      total: result.data.length,
      unread_count: result.data.filter((n) => !n.is_read).length,
      page: params.page ?? 1,
      limit: params.limit ?? 20,
      has_more: false,
    };

    return {
      notifications: result.data,
      ...pagination,
    };
  },

  /**
   * Get unread notifications count
   */
  getUnreadCount: async (): Promise<number> => {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/communications/notifications/unread/count`, {
      method: 'GET',
      headers
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch unread count');
    }

    const result: UnreadCountResponse = await response.json();
    return result.data.unread_count;
  },

  /**
   * Mark a single notification as read
   */
  markAsRead: async (notificationId: string): Promise<void> => {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/communications/notifications/${notificationId}/read`, {
      method: 'PATCH',
      headers
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to mark notification as read');
    }

    notificationsCache = null;
  },

  /**
   * Mark all notifications as read
   */
  markAllAsRead: async (): Promise<void> => {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/communications/notifications/read-all`, {
      method: 'PATCH',
      headers
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to mark all notifications as read');
    }

    notificationsCache = null;
  },

  /**
   * Delete a notification
   */
  deleteNotification: async (notificationId: string): Promise<void> => {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/communications/notifications/${notificationId}`, {
      method: 'DELETE',
      headers
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete notification');
    }

    notificationsCache = null;
  },

  /**
   * Delete all read notifications
   */
  clearReadNotifications: async (): Promise<number> => {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/communications/notifications/clear-read`, {
      method: 'DELETE',
      headers
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to clear read notifications');
    }

    notificationsCache = null;
    const result = await response.json();
    return result.data?.deleted_count ?? 0;
  },

  /**
   * Delete all notifications
   */
  clearAllNotifications: async (): Promise<number> => {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/communications/notifications/clear-all`, {
      method: 'DELETE',
      headers
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to clear all notifications');
    }

    notificationsCache = null;
    const result = await response.json();
    return result.data?.deleted_count ?? 0;
  },

  /**
   * Create a notification (Admin only)
   */
  createNotification: async (data: CreateNotificationDTO): Promise<Notification> => {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/communications/notifications`, {
      method: 'POST',
      headers,
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create notification');
    }

    notificationsCache = null;

    const result = await response.json();
    return result.data;
  }
};
