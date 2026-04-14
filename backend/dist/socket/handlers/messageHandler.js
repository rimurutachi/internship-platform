"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupMessageHandlers = void 0;
const messageService_1 = require("../../services/messageService");
const setupMessageHandlers = (io, socket) => {
    const userId = socket.user?.id;
    const userRole = socket.user?.role;
    if (!userId || !userRole)
        return;
    // Initial joining of a private room to receive messages
    socket.join(`user:${userId}`);
    socket.on("send_message", async (data, callback) => {
        try {
            if (!data.receiverId || !data.content) {
                if (callback)
                    callback({ error: "Receiver ID and content are required" });
                return;
            }
            // Basic role-based validation before sending
            // Check if they are valid contacts
            const validContacts = await messageService_1.messageService.getContacts(userId, userRole);
            const receiverRole = validContacts.find(c => c.id === data.receiverId)?.role;
            const isAllowed = !!receiverRole;
            if (!isAllowed) {
                if (callback)
                    callback({ error: "You are not allowed to message this user." });
                return;
            }
            const savedMessage = await messageService_1.messageService.sendMessage(userId, data.receiverId, data.content);
            // Emit the message to the receiver's room
            io.to(`user:${data.receiverId}`).emit("receive_message", savedMessage);
            // Emit the message back to the sender
            socket.emit("receive_message", savedMessage);
            if (callback) {
                callback({ success: true, message: savedMessage });
            }
        }
        catch (error) {
            console.error("Error sending message:", error);
            if (callback) {
                callback({ error: error.message || "Failed to send message" });
            }
        }
    });
    socket.on("mark_messages_read", async (data, callback) => {
        try {
            if (!data.messageIds || !data.messageIds.length) {
                if (callback)
                    callback({ success: true });
                return;
            }
            await messageService_1.messageService.markAsRead(data.messageIds);
            // Optionally notify other sockets of the read status
            socket.emit("messages_marked_read", { messageIds: data.messageIds });
            if (callback) {
                callback({ success: true });
            }
        }
        catch (error) {
            console.error("Error marking messages read:", error);
            if (callback) {
                callback({ error: error.message || "Failed to mark messages read" });
            }
        }
    });
};
exports.setupMessageHandlers = setupMessageHandlers;
//# sourceMappingURL=messageHandler.js.map