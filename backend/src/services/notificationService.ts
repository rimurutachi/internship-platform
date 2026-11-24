import { createClient } from "@supabase/supabase-js";
import {
  CreateNotificationDTO,
  Notification,
  NotificationCategory,
  NotificationQueryOptions,
  PaginatedNotificationsResult,
} from "../models/communication";
import {
  emitNewNotification,
  emitNotificationCountUpdate,
} from "../socket/emitters";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const CATEGORY_TYPE_MAP: Record<Exclude<NotificationCategory, "all">, string[]> = {
  internship: [
    "internship_created",
    "internship_updated",
    "internship_active",
    "internship_completed",
    "internship_cancelled",
    "internship_reminder",
  ],
  document: [
    "document_shared",
    "document_required",
    "document_submitted",
    "document_reviewed",
    "document_revision_requested",
    "document_approved",
    "document_rejected",
    "document_pre_approved",
    "document_pre_approval_reverted",
    "document_template_uploaded",
    "weekly_report_submitted",
    "weekly_report_approved",
    "weekly_report_rejected",
    "comment_added",
  ],
  evaluation: [
    "evaluation_submitted",
    "evaluation_approved",
    "evaluation_revision_requested",
    "evaluation_rejected",
    "evaluation_grade_overridden",
    "evaluation_reminder",
  ],
  message: ["message", "message_received", "mention"],
  system: [
    "system",
    "profile_verified",
    "profile_rejected",
    "student_graduated",
    "account_archive_warning",
    "account_archived",
    "account_updated",
    "account_restored",
  ],
};

function buildNotificationPayload(data: CreateNotificationDTO) {
  const payload: Record<string, any> = {
    user_id: data.user_id,
    type: data.type,
    title: data.title,
    message: data.message,
    action_url: data.action_url || null,
    reference_type: data.reference_type || null,
    metadata: data.metadata || {},
    is_read: false,
  };

  if (data.reference_id && UUID_REGEX.test(data.reference_id)) {
    payload.reference_id = data.reference_id;
  }

  return payload;
}

export class NotificationService {
  // Create notification
  async createNotification(data: CreateNotificationDTO): Promise<Notification> {
    const notificationData = buildNotificationPayload(data);

    const { data: notification, error } = await supabase
      .from("notifications")
      .insert(notificationData)
      .select()
      .single();

    if (error) throw new Error(error.message);
    if (!notification) throw new Error("Failed to create notification");

    // Emit real-time notification
    emitNewNotification(data.user_id, notification);

    // Get and emit updated count
    const count = await this.getUnreadNotificationsCount(data.user_id);
    emitNotificationCountUpdate(data.user_id, count);

    return notification;
  }

  // Get user notifications (simple recent list)
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

  // Get user notifications with pagination, status, category, and search filters
  async getUserNotificationsPaginated(
    userId: string,
    options: NotificationQueryOptions = {}
  ): Promise<PaginatedNotificationsResult> {
    const limit = Math.min(Math.max(1, options.limit || 20), 100);
    const page = Math.max(1, options.page || 1);
    const offset =
      options.offset !== undefined
        ? Math.max(0, options.offset)
        : (page - 1) * limit;

    let query = supabase
      .from("notifications")
      .select("*", { count: "exact" })
      .eq("user_id", userId);

    if (options.is_read !== undefined) {
      query = query.eq("is_read", options.is_read);
    }

    if (options.category && options.category !== "all") {
      const types = CATEGORY_TYPE_MAP[options.category];
      if (types && types.length > 0) {
        query = query.in("type", types);
      }
    }

    if (options.type) {
      query = query.eq("type", options.type);
    }

    if (options.search && options.search.trim().length > 0) {
      const term = options.search.trim().replace(/[,%()]/g, "");
      if (term.length > 0) {
        query = query.or(`title.ilike.%${term}%,message.ilike.%${term}%`);
      }
    }

    const { data, error, count } = await query
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw new Error(error.message);

    const unreadCount = await this.getUnreadNotificationsCount(userId);
    const total = count || 0;
    const notifications = data || [];

    return {
      notifications,
      total,
      unread_count: unreadCount,
      page,
      limit,
      has_more: offset + notifications.length < total,
    };
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

    const count = await this.getUnreadNotificationsCount(userId);
    emitNotificationCountUpdate(userId, count);
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

    emitNotificationCountUpdate(userId, 0);
  }

  // Delete notification
  async deleteNotification(
    notificationId: string,
    userId: string
  ): Promise<void> {
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

    const count = await this.getUnreadNotificationsCount(userId);
    emitNotificationCountUpdate(userId, count);
  }

  // Delete all read notifications for user
  async deleteReadNotifications(userId: string): Promise<number> {
    const { data, error } = await supabase
      .from("notifications")
      .delete()
      .eq("user_id", userId)
      .eq("is_read", true)
      .select("id");

    if (error) throw new Error(error.message);

    const count = await this.getUnreadNotificationsCount(userId);
    emitNotificationCountUpdate(userId, count);

    return data?.length || 0;
  }

  // Delete all notifications for user
  async deleteAllNotifications(userId: string): Promise<number> {
    const { data, error } = await supabase
      .from("notifications")
      .delete()
      .eq("user_id", userId)
      .select("id");

    if (error) throw new Error(error.message);

    emitNotificationCountUpdate(userId, 0);

    return data?.length || 0;
  }

  // Bulk create notifications with full DB rows + real-time emit + count update
  async createBulkNotifications(
    notifications: CreateNotificationDTO[]
  ): Promise<Notification[]> {
    if (!notifications || notifications.length === 0) {
      return [];
    }

    const validItems = notifications.filter(
      (n) => n && n.user_id && n.type && n.title && n.message
    );
    if (validItems.length === 0) {
      return [];
    }

    const notificationData = validItems.map(buildNotificationPayload);

    const { data: inserted, error } = await supabase
      .from("notifications")
      .insert(notificationData)
      .select();

    if (error) throw new Error(error.message);

    const createdRows: Notification[] = inserted || [];

    // Emit each persisted notification (with DB id & created_at)
    for (const row of createdRows) {
      emitNewNotification(row.user_id, row);
    }

    // Emit updated unread counts per unique recipient
    const uniqueUserIds = Array.from(
      new Set(createdRows.map((row) => row.user_id))
    );
    await Promise.all(
      uniqueUserIds.map(async (uid) => {
        try {
          const count = await this.getUnreadNotificationsCount(uid);
          emitNotificationCountUpdate(uid, count);
        } catch (err) {
          console.error(
            `⚠️ Failed to emit unread count for user ${uid}:`,
            err
          );
        }
      })
    );

    return createdRows;
  }

  // Notify all active, non-archived admins
  async notifyAdmins(
    payload: Omit<CreateNotificationDTO, "user_id">,
    excludeUserId?: string
  ): Promise<void> {
    try {
      const { data: admins, error } = await supabase
        .from("users")
        .select("id")
        .eq("role", "admin")
        .eq("status", "active")
        .or("is_archived.is.null,is_archived.eq.false");

      if (error || !admins || admins.length === 0) {
        return;
      }

      const recipientIds = admins
        .map((a) => a.id)
        .filter((id) => id && id !== excludeUserId);

      if (recipientIds.length === 0) {
        return;
      }

      await this.createBulkNotifications(
        recipientIds.map((adminId) => ({
          ...payload,
          user_id: adminId,
        }))
      );
    } catch (err) {
      console.error("⚠️ Failed to notify admins:", err);
    }
  }
}

export default new NotificationService();
