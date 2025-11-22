"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupNotificationHandlers = void 0;
const setupNotificationHandlers = (io, socket) => {
    const userId = socket.user?.id;
    // User joins their personal notification room
    socket.join(`user:${userId}`);
    console.log(`User ${userId} joined notification room`);
    // Request notification count
    socket.on("get_notification_count", async () => {
        socket.emit("notification_count_updated", { count: 0 });
    });
};
exports.setupNotificationHandlers = setupNotificationHandlers;
//# sourceMappingURL=notificationHandler.js.map