import { Router, Request, Response, NextFunction } from "express";
import multer from "multer";
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

// Configure multer for file uploads (memory storage)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max file size
  },
  fileFilter: (req, file, cb) => {
    // Allow common file types
    const allowedMimes = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "text/plain",
      "application/zip",
    ];

    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type. Only images, PDFs, and documents are allowed."));
    }
  },
});

const router = Router();

// All routes require authentication
router.use(authenticateToken);

/* Message Routes */

// Send message (with optional file upload)
router.post(
  "/messages",
  (req: Request, res: Response, next: NextFunction) => {
    upload.single("file")(req, res, (err: any) => {
      if (err) {
        console.error("Multer error:", err);
        return res.status(400).json({
          success: false,
          error: err.message || "File upload error",
        });
      }
      next();
    });
  },
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

// Search users for new conversations
router.get("/users/search", communicationController.searchUsers);

// Create or get direct conversation
router.post("/conversations/direct", communicationController.createDirectConversation);

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
