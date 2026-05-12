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
  updated_at: string;
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
   * Get user notifications
   * @param limit - Number of notifications to fetch (default: 50, max: 100)
   * @param forceRefresh - Bypass cache and force a network request
   */
  getNotifications: async (limit: number = 50, forceRefresh: boolean = false): Promise<Notification[]> => {
    // Check cache
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
    
    // Update cache
    notificationsCache = {
      data: result.data,
      timestamp: Date.now()
    };
    
    return result.data;
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
   * @param notificationId - ID of the notification to mark as read
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

    // Invalidate cache since data has changed
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

    // Invalidate cache
    notificationsCache = null;
  },

  /**
   * Delete a notification
   * @param notificationId - ID of the notification to delete
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

    // Invalidate cache
    notificationsCache = null;
  },

  /**
   * Create a notification (Admin only)
   * @param data - Notification data
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

    // Invalidate cache
    notificationsCache = null;

    const result = await response.json();
    return result.data;
  }
};
