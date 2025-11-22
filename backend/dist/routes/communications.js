"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const communicationController_1 = __importDefault(require("../controllers/communicationController"));
const communciationValidators_1 = require("../middleware/communciationValidators");
const router = (0, express_1.Router)();
// All routes require authentication
router.use(auth_1.authenticateToken);
/* Message Routes */
// Send message
router.post("/messages", communciationValidators_1.sanitizeMessageInput, communciationValidators_1.validateCreateMessage, communciationValidators_1.validateConversationAccess, communicationController_1.default.sendMessage);
// Get conversation message
router.get("/messages/:conversationId", communciationValidators_1.validateGetMessages, communciationValidators_1.validateConversationAccess, communicationController_1.default.getMessages);
// Edit message
router.patch("/messages/:messageId", communciationValidators_1.sanitizeMessageInput, communciationValidators_1.validateEditMessage, communciationValidators_1.validateMessageOwnership, communicationController_1.default.editMessage);
// Delete message
router.delete("/messages/:messageId", communciationValidators_1.validateDeleteMessage, communciationValidators_1.validateMessageOwnership, communicationController_1.default.deleteMessage);
/* Conversation Routes */
// Create conversation
router.post("/conversations", communciationValidators_1.sanitizeConversationName, communciationValidators_1.validateCreateConversation, communicationController_1.default.createConversation);
// Get user conversations
router.get("/conversations", communicationController_1.default.getUserConversations);
// Get single conversation
router.get("/conversations/:conversationId", communciationValidators_1.validateGetConversation, communciationValidators_1.validateConversationAccess, communicationController_1.default.getConversation);
// Mark conversation as read
router.patch("/conversations/:conversationId/read", communciationValidators_1.validateMarkAsRead, communciationValidators_1.validateConversationAccess, communicationController_1.default.markAsRead);
// Get unread count
router.get("/conversations/unread/count", communicationController_1.default.getUnreadCount);
/* Notification Routes */
// Create notification (Admin only)
router.post("/notifications", (0, auth_1.requireRole)(["admin"]), communciationValidators_1.validateCreateNotification, communicationController_1.default.createNotification);
// Get user notifications
router.get("/notifications", communciationValidators_1.validateGetNotifications, communicationController_1.default.getNotifications);
// Get unread notifications count
router.get("/notifications/unread/count", communicationController_1.default.getUnreadNotificationsCount);
// Mark single notification as read
router.patch("/notifications/:notificationId/read", communciationValidators_1.validateMarkNotificationAsRead, communciationValidators_1.validateNotificationOwnership, communicationController_1.default.markNotificationAsRead);
// Mark all notifications as read
router.patch("/notifications/read-all", communicationController_1.default.markAllAsRead);
// Delete notification
router.delete("/notifications/:notificationId", communciationValidators_1.validateMarkNotificationAsRead, communciationValidators_1.validateNotificationOwnership, communicationController_1.default.deleteNotification);
exports.default = router;
//# sourceMappingURL=communications.js.map