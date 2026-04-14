"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.emitEvaluationUpdate = exports.emitNotificationCountUpdate = exports.emitNewNotification = void 0;
const server_1 = require("../server");
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
//# sourceMappingURL=emitters.js.map