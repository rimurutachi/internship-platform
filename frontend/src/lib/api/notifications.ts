import { createSupabaseClient } from '../supabase';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

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

export const notificationsAPI = {
  /**
   * Get user notifications
   * @param limit - Number of notifications to fetch (default: 50, max: 100)
   */
  getNotifications: async (limit: number = 50): Promise<Notification[]> => {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/api/communication/notifications?limit=${limit}`, {
      method: 'GET',
      headers
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch notifications');
    }

    const result: NotificationsResponse = await response.json();
    return result.data;
  },

  /**
   * Get unread notifications count
   */
  getUnreadCount: async (): Promise<number> => {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/api/communication/notifications/unread/count`, {
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
    const response = await fetch(`${API_BASE_URL}/api/communication/notifications/${notificationId}/read`, {
      method: 'PATCH',
      headers
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to mark notification as read');
    }
  },

  /**
   * Mark all notifications as read
   */
  markAllAsRead: async (): Promise<void> => {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/api/communication/notifications/read-all`, {
      method: 'PATCH',
      headers
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to mark all notifications as read');
    }
  },

  /**
   * Delete a notification
   * @param notificationId - ID of the notification to delete
   */
  deleteNotification: async (notificationId: string): Promise<void> => {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/api/communication/notifications/${notificationId}`, {
      method: 'DELETE',
      headers
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete notification');
    }
  },

  /**
   * Create a notification (Admin only)
   * @param data - Notification data
   */
  createNotification: async (data: CreateNotificationDTO): Promise<Notification> => {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/api/communication/notifications`, {
      method: 'POST',
      headers,
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create notification');
    }

    const result = await response.json();
    return result.data;
  }
};
