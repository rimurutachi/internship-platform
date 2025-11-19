/**
 * Notification API Service
 * 
 * Handles all notification-related API calls
 */

import { get, patch, del } from '../client';
import type { Notification, PaginatedResponse, ListParams } from '@/types/api';

/**
 * Notification service
 */
export const notificationService = {
  /**
   * Get all notifications for current user
   */
  list: async (params?: ListParams): Promise<PaginatedResponse<Notification>> => {
    return get<PaginatedResponse<Notification>>('/notifications', params);
  },

  /**
   * Get unread notifications count
   */
  getUnreadCount: async (): Promise<{ count: number }> => {
    return get('/notifications/unread-count');
  },

  /**
   * Mark notification as read
   */
  markAsRead: async (id: string): Promise<void> => {
    return patch(`/notifications/${id}/read`);
  },

  /**
   * Mark all notifications as read
   */
  markAllAsRead: async (): Promise<void> => {
    return patch('/notifications/read-all');
  },

  /**
   * Delete a notification
   */
  delete: async (id: string): Promise<void> => {
    return del(`/notifications/${id}`);
  },

  /**
   * Delete all read notifications
   */
  deleteAllRead: async (): Promise<void> => {
    return del('/notifications/read');
  },
};
