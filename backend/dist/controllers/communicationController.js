"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommunicationController = void 0;
const messageService_1 = __importDefault(require("../services/messageService"));
const conversationService_1 = __importDefault(require("../services/conversationService"));
const notificationService_1 = __importDefault(require("../services/notificationService"));
class CommunicationController {
    /* Messages */
    // Send message
    async sendMessage(req, res) {
        try {
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({
                    success: false,
                    error: "User not authenticated",
                });
            }
            const message = await messageService_1.default.sendMessage(userId, req.body);
            return res.status(201).json({ success: true, data: message });
        }
        catch (error) {
            const statusCode = error.message.includes("not found") ||
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
    async getMessages(req, res) {
        try {
            const { conversationId } = req.params;
            const { limit = 50, offset = 0 } = req.query;
            const messages = await messageService_1.default.getMessages(conversationId, Number(limit), Number(offset));
            return res.json({ success: true, data: messages });
        }
        catch (error) {
            const statusCode = error.message.includes("not found") ? 404 : 400;
            return res.status(statusCode).json({
                success: false,
                error: error.message || "Failed to retrieve messages",
            });
        }
    }
    // Edit message
    async editMessage(req, res) {
        try {
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({
                    success: false,
                    error: "User not authenticated",
                });
            }
            const { messageId } = req.params;
            const { content } = req.body;
            if (!content || content.trim().length === 0) {
                return res.status(400).json({
                    success: false,
                    error: "Message content is required",
                });
            }
            const message = await messageService_1.default.editMessage(messageId, userId, content);
            return res.json({ success: true, data: message });
        }
        catch (error) {
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
    async deleteMessage(req, res) {
        try {
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({
                    success: false,
                    error: "User not authenticated",
                });
            }
            const { messageId } = req.params;
            await messageService_1.default.deleteMessage(messageId, userId);
            return res.json({
                success: true,
                message: "Message deleted successfully",
            });
        }
        catch (error) {
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
    async createConversation(req, res) {
        try {
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({
                    success: false,
                    error: "User not authenticated",
                });
            }
            const conversation = await conversationService_1.default.createConversation(userId, req.body);
            return res.status(201).json({ success: true, data: conversation });
        }
        catch (error) {
            return res.status(400).json({
                success: false,
                error: error.message || "Failed to create conversation",
            });
        }
    }
    // Get user conversation
    async getUserConversations(req, res) {
        try {
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({
                    success: false,
                    error: "User not authenticated",
                });
            }
            const conversations = await conversationService_1.default.getUserConversations(userId);
            return res.json({ success: true, data: conversations });
        }
        catch (error) {
            console.error("Error in getUserConversations:", error);
            return res.status(400).json({
                success: false,
                error: error.message || "Failed to retrieve conversations",
            });
        }
    }
    // Get conversation by Id
    async getConversation(req, res) {
        try {
            const { conversationId } = req.params;
            const conversation = await conversationService_1.default.getConversation(conversationId);
            return res.json({ success: true, data: conversation });
        }
        catch (error) {
            const statusCode = error.message.includes("not found") ? 404 : 400;
            return res.status(statusCode).json({
                success: false,
                error: error.message || "Failed to retrieve conversation",
            });
        }
    }
    // Mark conversation as read
    async markAsRead(req, res) {
        try {
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({
                    success: false,
                    error: "User not authenticated",
                });
            }
            const { conversationId } = req.params;
            await conversationService_1.default.markAsRead(conversationId, userId);
            return res.json({
                success: true,
                message: "Conversation marked as read",
            });
        }
        catch (error) {
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
    async getUnreadCount(req, res) {
        try {
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({
                    success: false,
                    error: "User not authenticated",
                });
            }
            const count = await conversationService_1.default.getUnreadCount(userId);
            return res.json({ success: true, data: { unread_count: count } });
        }
        catch (error) {
            return res.status(400).json({
                success: false,
                error: error.message || "Failed to get unread count",
            });
        }
    }
    /* Notifications */
    // Create notification
    async createNotification(req, res) {
        try {
            const notification = await notificationService_1.default.createNotification(req.body);
            return res.status(201).json({ success: true, data: notification });
        }
        catch (error) {
            return res.status(400).json({
                success: false,
                error: error.message || "Failed to create notification",
            });
        }
    }
    // Get user notifications
    async getNotifications(req, res) {
        try {
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({
                    success: false,
                    error: "User not authenticated",
                });
            }
            const { limit = 50 } = req.query;
            const notifications = await notificationService_1.default.getUserNotifications(userId, Number(limit));
            return res.json({ success: true, data: notifications });
        }
        catch (error) {
            return res.status(400).json({
                success: false,
                error: error.message || "Failed to retrieve notifications",
            });
        }
    }
    // Get unread notifications count
    async getUnreadNotificationsCount(req, res) {
        try {
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({
                    success: false,
                    error: "User not authenticated",
                });
            }
            const count = await notificationService_1.default.getUnreadNotificationsCount(userId);
            return res.json({ success: true, data: { unread_count: count } });
        }
        catch (error) {
            return res.status(400).json({
                success: false,
                error: error.message || "Failed to get unread notifications count",
            });
        }
    }
    // Mark notifications as read
    async markNotificationAsRead(req, res) {
        try {
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({
                    success: false,
                    error: "User not authenticated",
                });
            }
            const { notificationId } = req.params;
            await notificationService_1.default.markAsRead(notificationId, userId);
            return res.json({
                success: true,
                message: "Notification marked as read",
            });
        }
        catch (error) {
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
    async markAllAsRead(req, res) {
        try {
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({
                    success: false,
                    error: "User not authenticated",
                });
            }
            await notificationService_1.default.markAllAsRead(userId);
            return res.json({
                success: true,
                message: "All notifications marked as read",
            });
        }
        catch (error) {
            return res.status(400).json({
                success: false,
                error: error.message || "Failed to mark all notifications as read",
            });
        }
    }
    // Delete notification
    async deleteNotification(req, res) {
        try {
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({
                    success: false,
                    error: "User not authenticated",
                });
            }
            const { notificationId } = req.params;
            await notificationService_1.default.deleteNotification(notificationId, userId);
            return res.json({
                success: true,
                message: "Notification deleted successfully",
            });
        }
        catch (error) {
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
exports.CommunicationController = CommunicationController;
exports.default = new CommunicationController();
//# sourceMappingURL=communicationController.js.map