"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupMessageHandlers = void 0;
const setupMessageHandlers = (io, socket) => {
    const userId = socket.user?.id;
    // Join conversation room
    socket.on("join_conversation", (conversationId) => {
        socket.join(`conversation:${conversationId}`);
        console.log(`User ${userId} joined conversation ${conversationId}`);
    });
    // Leave conversation room
    socket.on("leave_conversation", (conversationId) => {
        socket.leave(`conversation:${conversationId}`);
        console.log(`User ${userId} left the conversation ${conversationId}`);
    });
    // Typing indicator
    socket.on("typing", (data) => {
        socket.to(`conversation:${data.conversationId}`).emit("user_typing", {
            userId,
            userName: data.userName,
            conversationId: data.conversationId,
        });
    });
    // Stop typing indicator
    socket.on("stop_typing", (data) => {
        socket.to(`conversation:${data.conversationId}`).emit("user_stop_typing", {
            userId,
            conversationId: data.conversationId,
        });
    });
    // Mark messages as read
    socket.on("mark_read", (data) => {
        socket.to(`conversation:${data.conversationId}`).emit("message_read", {
            userId,
            conversationId: data.conversationId,
            timestamp: new Date(),
        });
    });
};
exports.setupMessageHandlers = setupMessageHandlers;
//# sourceMappingURL=messageHandler.js.map