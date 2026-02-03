"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationService = void 0;
const supabase_js_1 = require("@supabase/supabase-js");
const emitters_1 = require("../socket/emitters");
const supabase = (0, supabase_js_1.createClient)(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
class NotificationService {
    // Create notification
    async createNotification(data) {
        const notificationData = {
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
        if (error)
            throw new Error(error.message);
        if (!notification)
            throw new Error("Failed to create notification");
        // Emit real-time notification
        (0, emitters_1.emitNewNotification)(data.user_id, notification);
        // Get and emit updated count
        const count = await this.getUnreadNotificationsCount(data.user_id);
        (0, emitters_1.emitNotificationCountUpdate)(data.user_id, count);
        return notification;
    }
    // Get user notifications
    async getUserNotifications(userId, limit = 50) {
        const validLimit = Math.min(Math.max(1, limit), 100);
        const { data, error } = await supabase
            .from("notifications")
            .select("*")
            .eq("user_id", userId)
            .order("created_at", { ascending: false })
            .limit(validLimit);
        if (error)
            throw new Error(error.message);
        return data || [];
    }
    // Get unread notifications count
    async getUnreadNotificationsCount(userId) {
        const { count, error } = await supabase
            .from("notifications")
            .select("*", { count: "exact", head: true })
            .eq("user_id", userId)
            .eq("is_read", false);
        if (error)
            throw new Error(error.message);
        return count || 0;
    }
    // Mark as read
    async markAsRead(notificationId, userId) {
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
        if (error)
            throw new Error(error.message);
        // Emit updated count
        const count = await this.getUnreadNotificationsCount(userId);
        (0, emitters_1.emitNotificationCountUpdate)(userId, count);
    }
    // Mark all notifications as read
    async markAllAsRead(userId) {
        const { error } = await supabase
            .from("notifications")
            .update({
            is_read: true,
            read_at: new Date().toISOString(),
        })
            .eq("user_id", userId)
            .eq("is_read", false);
        if (error)
            throw new Error(error.message);
        // Emit updated count (should be 0)
        (0, emitters_1.emitNotificationCountUpdate)(userId, 0);
    }
    // Delete notification
    async deleteNotification(notificationId, userId) {
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
        if (error)
            throw new Error(error.message);
        // Emit updated count
        const count = await this.getUnreadNotificationsCount(userId);
        (0, emitters_1.emitNotificationCountUpdate)(userId, count);
    }
    // Bulk create notifications
    async createBulkNotifications(notifications) {
        if (!notifications || notifications.length === 0) {
            throw new Error("No notifications provided");
        }
        const notificationData = notifications.map((notif) => {
            const data = {
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
        if (error)
            throw new Error(error.message);
        // Emit to each user
        notifications.forEach((notif) => {
            (0, emitters_1.emitNewNotification)(notif.user_id, notif);
        });
    }
}
exports.NotificationService = NotificationService;
exports.default = new NotificationService();
//# sourceMappingURL=notificationService.js.map