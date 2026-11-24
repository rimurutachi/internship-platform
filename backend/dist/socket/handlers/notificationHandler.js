"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupNotificationHandlers = void 0;
const notificationService_1 = __importDefault(require("../../services/notificationService"));
const setupNotificationHandlers = (_io, socket) => {
    const userId = socket.user?.id;
    if (!userId)
        return;
    // User joins their personal notification room
    socket.join(`user:${userId}`);
    console.log(`User ${userId} joined notification room`);
    const emitRealUnreadCount = async () => {
        try {
            const count = await notificationService_1.default.getUnreadNotificationsCount(userId);
            socket.emit("notification_count_updated", { count });
        }
        catch (err) {
            console.error(`Failed to fetch unread count for user ${userId}:`, err);
        }
    };
    // Handle explicit subscription requests from frontend
    socket.on("notification:subscribe", async () => {
        socket.join(`user:${userId}`);
        await emitRealUnreadCount();
    });
    // Request current notification count
    socket.on("get_notification_count", async () => {
        await emitRealUnreadCount();
    });
};
exports.setupNotificationHandlers = setupNotificationHandlers;
//# sourceMappingURL=notificationHandler.js.map