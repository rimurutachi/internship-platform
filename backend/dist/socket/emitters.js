"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.emitConversationUpdate = exports.emitEvaluationUpdate = exports.emitNotificationCountUpdate = exports.emitNewNotification = exports.emitMessageDeleted = exports.emitMessageEdited = exports.emitNewMessage = void 0;
const server_1 = require("../server");
// Emit new message to conversation
const emitNewMessage = (conversationId, message) => {
    server_1.io.to(`conversation:${conversationId}`).emit("new_message", message);
};
exports.emitNewMessage = emitNewMessage;
// Emit message edited
const emitMessageEdited = (conversationId, message) => {
    server_1.io.to(`conversation:${conversationId}`).emit("message_edited", message);
};
exports.emitMessageEdited = emitMessageEdited;
// Emit message deleted
const emitMessageDeleted = (conversationId, messageId) => {
    server_1.io.to(`conversation:${conversationId}`).emit("message_deleted", {
        messageId,
    });
};
exports.emitMessageDeleted = emitMessageDeleted;
// Emit new notification to user
const emitNewNotification = (userId, notification) => {
    server_1.io.to(`user:${userId}`).emit("new_notification", notification);
};
exports.emitNewNotification = emitNewNotification;
// Emit notification count update
const emitNotificationCountUpdate = (userId, count) => {
    server_1.io.to(`user:${userId}`).emit("notification_count_updated", { count });
};
exports.emitNotificationCountUpdate = emitNotificationCountUpdate;
// Emit evaluation update
const emitEvaluationUpdate = (evaluationId, data) => {
    server_1.io.to(`evaluation:${evaluationId}`).emit("evaluation_updated", data);
};
exports.emitEvaluationUpdate = emitEvaluationUpdate;
// Emit conversation updated (last_message_at, unread count)
const emitConversationUpdate = (userId, conversationId, data) => {
    server_1.io.to(`user:${userId}`).emit("conversation_updated", {
        conversationId,
        ...data,
    });
};
exports.emitConversationUpdate = emitConversationUpdate;
//# sourceMappingURL=emitters.js.map