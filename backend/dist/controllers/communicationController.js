"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommunicationController = void 0;
const notificationService_1 = __importDefault(require("../services/notificationService"));
const typeGuards_1 = require("../utils/typeGuards");
class CommunicationController {
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
            const notificationId = (0, typeGuards_1.ensureString)(req.params.notificationId, 'notificationId');
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
            const notificationId = (0, typeGuards_1.ensureString)(req.params.notificationId, 'notificationId');
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