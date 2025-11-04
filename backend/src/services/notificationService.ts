import { createClient } from "@supabase/supabase-js";
import { CreateNotificationDTO, Notification } from "../models/communication";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

export class NotificationService {
  // Create notification
  async createNotification(data: CreateNotificationDTO): Promise<Notification> {
    const notificationData: any = {
      user_id: data.user_id,
      type: data.type,
      title: data.title,
      message: data.message,
      action_url: data.action_url,
      reference_type: data.reference_type,
      is_read: false,
    };

    const { data: notification, error } = await supabase
      .from("notifications")
      .insert(notificationData)
      .select()
      .single();

    if (error) throw new Error(error.message);
    if (!notification) throw new Error("Failed to create notification");
    return notification;
  }

  // Get user notifications
  async getUserNotifications(
    userId: string,
    limit = 50
  ): Promise<Notification[]> {
    const validLimit = Math.min(Math.max(1, limit), 100);

    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(validLimit);

    if (error) throw new Error(error.message);
    return data || [];
  }

  // Get unread notifications count
  async getUnreadNotificationsCount(userId: string): Promise<number> {
    const { count, error } = await supabase
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("is_read", false);

    if (error) throw new Error(error.message);
    return count || 0;
  }

  // Mark as read
  async markAsRead(notificationId: string, userId: string): Promise<void> {
    // Verify notification exists and belongs to user
    const { data: notification, error: checkError } = await supabase
      .from("notifications")
      .select("id, user_id")
      .eq("id", notificationId)
      .single();

    if (checkError || !notification) {
      throw new Error("Notification not found");
    }

    if (notification.user_id !== userId) {
      throw new Error("You can only mark your own notifications as read");
    }

    const { error } = await supabase
      .from("notifications")
      .update({
        is_read: true,
        read_at: new Date().toISOString(),
      })
      .eq("id", notificationId)
      .eq("user_id", userId);

    if (error) throw new Error(error.message);
  }

  // Mark all notifications as read
  async markAllAsRead(userId: string): Promise<void> {
    const { error } = await supabase
      .from("notifications")
      .update({
        is_read: true,
        read_at: new Date().toISOString(),
      })
      .eq("user_id", userId)
      .eq("is_read", false);

    if (error) throw new Error(error.message);
  }

  // Delete notification
  async deleteNotification(
    notificationId: string,
    userId: string
  ): Promise<void> {
    // Verify notification exists and belongs to user
    const { data: notification, error: checkError } = await supabase
      .from("notifications")
      .select("id, user_id")
      .eq("id", notificationId)
      .single();

    if (checkError || !notification) {
      throw new Error("Notification not found");
    }

    if (notification.user_id !== userId) {
      throw new Error("You can only delete your own notifications");
    }

    const { error } = await supabase
      .from("notifications")
      .delete()
      .eq("id", notificationId)
      .eq("user_id", userId);

    if (error) throw new Error(error.message);
  }

  // Bulk create notifications
  async createBulkNotifications(
    notifications: CreateNotificationDTO[]
  ): Promise<void> {
    if (!notifications || notifications.length === 0) {
      throw new Error("No notifications provided");
    }

    const notificationData = notifications.map((notif) => {
      const data: any = {
        user_id: notif.user_id,
        type: notif.type,
        title: notif.title,
        message: notif.message,
        action_url: notif.action_url,
        reference_type: notif.reference_type,
        is_read: false,
      };

      return data;
    });

    const { error } = await supabase
      .from("notifications")
      .insert(notificationData);

    if (error) throw new Error(error.message);
  }
}

export default new NotificationService();
