import { Router } from "express";
import { authenticateToken, requireRole } from "../middleware/auth";
import communicationController from "../controllers/communicationController";
import {
  validateCreateMessage,
  validateEditMessage,
  validateDeleteMessage,
  validateGetMessages,
  validateCreateConversation,
  validateGetConversation,
  validateMarkAsRead,
  validateGetNotifications,
  validateMarkNotificationAsRead,
  validateCreateNotification,
  sanitizeMessageInput,
  sanitizeConversationName,
  validateConversationAccess,
  validateMessageOwnership,
  validateNotificationOwnership,
} from "../middleware/communciationValidators";

const router = Router();

// All routes require authentication
router.use(authenticateToken);

/* Message Routes */

// Send message
router.post(
  "/messages",
  sanitizeMessageInput,
  validateCreateMessage,
  validateConversationAccess,
  communicationController.sendMessage
);

// Get conversation message
router.get(
  "/messages/:conversationId",
  validateGetMessages,
  validateConversationAccess,
  communicationController.getMessages
);

// Edit message
router.patch(
  "/messages/:messageId",
  sanitizeMessageInput,
  validateEditMessage,
  validateMessageOwnership,
  communicationController.editMessage
);

// Delete message
router.delete(
  "/messages/:messageId",
  validateDeleteMessage,
  validateMessageOwnership,
  communicationController.deleteMessage
);

/* Conversation Routes */

// Create conversation
router.post(
  "/conversations",
  sanitizeConversationName,
  validateCreateConversation,
  communicationController.createConversation
);

// Get user conversations
router.get("/conversations", communicationController.getUserConversations);

// Get single conversation
router.get(
  "/conversations/:conversationId",
  validateGetConversation,
  validateConversationAccess,
  communicationController.getConversation
);

// Mark conversation as read
router.patch(
  "/conversations/:conversationId/read",
  validateMarkAsRead,
  validateConversationAccess,
  communicationController.markAsRead
);

// Get unread count
router.get(
  "/conversations/unread/count",
  communicationController.getUnreadCount
);

/* Notification Routes */

// Create notification (Admin only)
router.post(
  "/notifications",
  requireRole(["admin"]),
  validateCreateNotification,
  communicationController.createNotification
);

// Get user notifications
router.get(
  "/notifications",
  validateGetNotifications,
  communicationController.getNotifications
);

// Get unread notifications count
router.get(
  "/notifications/unread/count",
  communicationController.getUnreadNotificationsCount
);

// Mark single notification as read
router.patch(
  "/notifications/:notificationId/read",
  validateMarkNotificationAsRead,
  validateNotificationOwnership,
  communicationController.markNotificationAsRead
);

// Mark all notifications as read
router.patch("/notifications/read-all", communicationController.markAllAsRead);

// Delete notification
router.delete(
  "/notifications/:notificationId",
  validateMarkNotificationAsRead,
  validateNotificationOwnership,
  communicationController.deleteNotification
);

export default router;
