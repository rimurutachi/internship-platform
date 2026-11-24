import { Request, Response } from "express";
import notificationService from "../services/notificationService";
import { AuthRequest } from "../middleware/auth";
import { ensureString } from "../utils/typeGuards";
import { NotificationCategory } from "../models/communication";

export class CommunicationController {
  /* Notifications */

  // Create notification
  async createNotification(req: Request, res: Response) {
    try {
      const notification = await notificationService.createNotification(
        req.body
      );

      return res.status(201).json({ success: true, data: notification });
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        error: error.message || "Failed to create notification",
      });
    }
  }

  // Internal service-to-service notification creation (e.g., from document-service)
  async createInternalNotifications(req: Request, res: Response) {
    try {
      const { notifications } = req.body || {};

      if (Array.isArray(notifications)) {
        const created = await notificationService.createBulkNotifications(
          notifications
        );
        return res.status(201).json({
          success: true,
          data: created,
          count: created.length,
        });
      }

      const { user_id, type, title, message } = req.body || {};
      if (!user_id || !type || !title || !message) {
        return res.status(400).json({
          success: false,
          error: "user_id, type, title, and message are required",
        });
      }

      const created = await notificationService.createNotification(req.body);
      return res.status(201).json({ success: true, data: created });
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        error: error.message || "Failed to create internal notification",
      });
    }
  }

  // Get user notifications (supports both simple list and paginated/filtered query)
  async getNotifications(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: "User not authenticated",
        });
      }

      const {
        limit = "50",
        page,
        offset,
        is_read,
        category,
        type,
        search,
        paginated,
      } = req.query;

      const usePagination =
        paginated === "true" ||
        page !== undefined ||
        offset !== undefined ||
        is_read !== undefined ||
        category !== undefined ||
        type !== undefined ||
        search !== undefined;

      if (usePagination) {
        const result = await notificationService.getUserNotificationsPaginated(
          userId,
          {
            limit: Number(limit) || 20,
            page: page ? Number(page) : 1,
            offset: offset !== undefined ? Number(offset) : undefined,
            is_read:
              is_read === "true"
                ? true
                : is_read === "false"
                ? false
                : undefined,
            category: (category as NotificationCategory) || undefined,
            type: type ? String(type) : undefined,
            search: search ? String(search) : undefined,
          }
        );

        return res.json({
          success: true,
          data: result.notifications,
          pagination: {
            total: result.total,
            unread_count: result.unread_count,
            page: result.page,
            limit: result.limit,
            has_more: result.has_more,
          },
        });
      }

      const notifications = await notificationService.getUserNotifications(
        userId,
        Number(limit)
      );

      return res.json({ success: true, data: notifications });
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        error: error.message || "Failed to retrieve notifications",
      });
    }
  }

  // Get unread notifications count
  async getUnreadNotificationsCount(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: "User not authenticated",
        });
      }

      const count = await notificationService.getUnreadNotificationsCount(
        userId
      );

      return res.json({ success: true, data: { unread_count: count } });
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        error: error.message || "Failed to get unread notifications count",
      });
    }
  }

  // Mark notifications as read
  async markNotificationAsRead(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: "User not authenticated",
        });
      }

      const notificationId = ensureString(
        req.params.notificationId,
        "notificationId"
      );

      await notificationService.markAsRead(notificationId, userId);

      return res.json({
        success: true,
        message: "Notification marked as read",
      });
    } catch (error: any) {
      const statusCode = error.message.includes("not found")
        ? 404
        : error.message.includes("only mark")
        ? 403
        : 400;
      return res.status(statusCode).json({
        success: false,
        error: error.message || "Failed to mark notification as read",
      });
    }
  }

  // Mark all notifications as read
  async markAllAsRead(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: "User not authenticated",
        });
      }

      await notificationService.markAllAsRead(userId);

      return res.json({
        success: true,
        message: "All notifications marked as read",
      });
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        error: error.message || "Failed to mark all notifications as read",
      });
    }
  }

  // Delete notification
  async deleteNotification(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: "User not authenticated",
        });
      }

      const notificationId = ensureString(
        req.params.notificationId,
        "notificationId"
      );

      await notificationService.deleteNotification(notificationId, userId);

      return res.json({
        success: true,
        message: "Notification deleted successfully",
      });
    } catch (error: any) {
      const statusCode = error.message.includes("not found")
        ? 404
        : error.message.includes("only delete")
        ? 403
        : 400;
      return res.status(statusCode).json({
        success: false,
        error: error.message || "Failed to delete notification",
      });
    }
  }

  // Clear all read notifications
  async clearReadNotifications(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: "User not authenticated",
        });
      }

      const deletedCount = await notificationService.deleteReadNotifications(
        userId
      );

      return res.json({
        success: true,
        data: { deleted_count: deletedCount },
        message: "Read notifications cleared successfully",
      });
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        error: error.message || "Failed to clear read notifications",
      });
    }
  }

  // Clear all notifications
  async clearAllNotifications(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: "User not authenticated",
        });
      }

      const deletedCount = await notificationService.deleteAllNotifications(
        userId
      );

      return res.json({
        success: true,
        data: { deleted_count: deletedCount },
        message: "All notifications cleared successfully",
      });
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        error: error.message || "Failed to clear all notifications",
      });
    }
  }
}

export default new CommunicationController();
