import { Request, Response } from "express";
import notificationService from "../services/notificationService";
import { AuthRequest } from "../middleware/auth";
import { ensureString } from '../utils/typeGuards';

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

  // Get user notifications
  async getNotifications(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: "User not authenticated",
        });
      }

      const { limit = 50 } = req.query;

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

      const notificationId = ensureString(req.params.notificationId, 'notificationId');

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

      const notificationId = ensureString(req.params.notificationId, 'notificationId');

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
}

export default new CommunicationController();
