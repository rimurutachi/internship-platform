import { Request, Response } from "express";
import messageService from "../services/messageService";
import conversationService from "../services/conversationService";
import notificationService from "../services/notificationService";
import { AuthRequest } from "../middleware/auth";
import { ensureString } from '../utils/typeGuards';

export class CommunicationController {
  /* Messages */
  // Send message
  async sendMessage(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: "User not authenticated",
        });
      }

      // Get file from multer if exists
      const file = req.file;
      
      // Validate: must have either content or file
      if (!req.body.content && !file) {
        return res.status(400).json({
          success: false,
          error: "Message must have content or file attachment",
        });
      }

      const message = await messageService.sendMessage(userId, req.body, file);
      return res.status(201).json({ success: true, data: message });
    } catch (error: any) {
      const statusCode =
        error.message.includes("not found") ||
        error.message.includes("No access")
          ? 404
          : 400;
      return res.status(statusCode).json({
        success: false,
        error: error.message || "Failed to send message",
      });
    }
  }

  // Get conversation messages
  async getMessages(req: Request, res: Response) {
    try {
      const conversationId = ensureString(req.params.conversationId, 'conversationId');
      const { limit = 50, offset = 0 } = req.query;

      const messages = await messageService.getMessages(
        conversationId,
        Number(limit),
        Number(offset)
      );

      return res.json({ success: true, data: messages });
    } catch (error: any) {
      const statusCode = error.message.includes("not found") ? 404 : 400;
      return res.status(statusCode).json({
        success: false,
        error: error.message || "Failed to retrieve messages",
      });
    }
  }

  // Edit message
  async editMessage(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: "User not authenticated",
        });
      }

      const messageId = ensureString(req.params.messageId, 'messageId');
      const { content } = req.body;

      if (!content || content.trim().length === 0) {
        return res.status(400).json({
          success: false,
          error: "Message content is required",
        });
      }

      const message = await messageService.editMessage(
        messageId,
        userId,
        content
      );

      return res.json({ success: true, data: message });
    } catch (error: any) {
      const statusCode = error.message.includes("not found")
        ? 404
        : error.message.includes("only edit")
        ? 403
        : 400;
      return res.status(statusCode).json({
        success: false,
        error: error.message || "Failed to edit message",
      });
    }
  }

  // Delete message
  async deleteMessage(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: "User not authenticated",
        });
      }

      const messageId = ensureString(req.params.messageId, 'messageId');

      await messageService.deleteMessage(messageId, userId);

      return res.json({
        success: true,
        message: "Message deleted successfully",
      });
    } catch (error: any) {
      const statusCode = error.message.includes("not found")
        ? 404
        : error.message.includes("only delete")
        ? 403
        : 400;
      return res.status(statusCode).json({
        success: false,
        error: error.message || "Failed to delete message",
      });
    }
  }

  /* Conversations */
  // Create conversation
  async createConversation(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: "User not authenticated",
        });
      }

      const conversation = await conversationService.createConversation(
        userId,
        req.body
      );

      return res.status(201).json({ success: true, data: conversation });
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        error: error.message || "Failed to create conversation",
      });
    }
  }

  // Get user conversation
  async getUserConversations(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: "User not authenticated",
        });
      }

      const conversations = await conversationService.getUserConversations(
        userId
      );

      return res.json({ success: true, data: conversations });
    } catch (error: any) {
      console.error("Error in getUserConversations:", error);
      return res.status(400).json({
        success: false,
        error: error.message || "Failed to retrieve conversations",
      });
    }
  }

  // Get conversation by Id
  async getConversation(req: Request, res: Response) {
    try {
      const conversationId = ensureString(req.params.conversationId, 'conversationId');
      const conversation = await conversationService.getConversation(
        conversationId
      );

      return res.json({ success: true, data: conversation });
    } catch (error: any) {
      const statusCode = error.message.includes("not found") ? 404 : 400;
      return res.status(statusCode).json({
        success: false,
        error: error.message || "Failed to retrieve conversation",
      });
    }
  }

  // Mark conversation as read
  async markAsRead(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: "User not authenticated",
        });
      }

      const conversationId = ensureString(req.params.conversationId, 'conversationId');

      await conversationService.markAsRead(conversationId, userId);

      return res.json({
        success: true,
        message: "Conversation marked as read",
      });
    } catch (error: any) {
      const statusCode = error.message.includes("not a participant")
        ? 403
        : error.message.includes("not found")
        ? 404
        : 400;
      return res.status(statusCode).json({
        success: false,
        error: error.message || "Failed to mark conversation as read",
      });
    }
  }

  // Get unread message count
  async getUnreadCount(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: "User not authenticated",
        });
      }

      const count = await conversationService.getUnreadCount(userId);

      return res.json({ success: true, data: { unread_count: count } });
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        error: error.message || "Failed to get unread count",
      });
    }
  }

  // Search users for starting conversations
  async searchUsers(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: "User not authenticated",
        });
      }

      const { q: searchQuery, role: roleFilter } = req.query;

      const users = await conversationService.searchUsers(
        userId,
        searchQuery as string,
        roleFilter as string
      );

      return res.json({ success: true, data: users });
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        error: error.message || "Failed to search users",
      });
    }
  }

  // Create or get direct conversation
  async createDirectConversation(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: "User not authenticated",
        });
      }

      const { otherUserId } = req.body;

      if (!otherUserId) {
        return res.status(400).json({
          success: false,
          error: "otherUserId is required",
        });
      }

      if (otherUserId === userId) {
        return res.status(400).json({
          success: false,
          error: "Cannot create conversation with yourself",
        });
      }

      const conversation = await conversationService.createDirectConversation(
        userId,
        otherUserId
      );

      return res.status(201).json({ success: true, data: conversation });
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        error: error.message || "Failed to create conversation",
      });
    }
  }

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
